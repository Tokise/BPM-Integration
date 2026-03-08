"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Search,
  Plus,
  UserPlus,
  MoreVertical,
  ChevronLeft,
  Target,
  UserCheck,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateSuccessionStatus } from "@/app/actions/hr";

export default function SuccessionPlanningPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user } = useUser();
  const [plans, setPlans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [newPlan, setNewPlan] = useState({
    potential_successor: "", // refers to employee_id
    position_title: "",
    readiness_status: "Ready in 1-2 Years",
    potential_rating: 4,
  });

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("succession_sync_updated")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "succession_planning",
        },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch succession plans with related profile for the successor
    const { data: planData } = await supabase
      .schema("bpm-anec-global")
      .from("succession_planning")
      .select(
        `
        id,
        position_title,
        target_role,
        potential_successor,
        employee_name,
        readiness_status,
        potential_rating,
        profiles!succession_planning_potential_successor_fkey (full_name, role)
      `,
      )
      .order("created_at", { ascending: false });

    // Fetch employees for dropdown
    const { data: empData } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("id, full_name, role")
      .in("role", [
        "employee",
        "HR",
        "Admin",
        "Finance",
        "Logistics",
        "hr",
        "admin",
        "finance",
        "logistics",
        "Employee",
      ])
      .order("full_name");

    if (empData) setEmployees(empData);
    if (planData) setPlans(planData);

    setLoading(false);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: string,
  ) => {
    const tid = toast.loading(
      "Updating status...",
    );
    try {
      const res = await updateSuccessionStatus(
        id,
        newStatus,
      );
      if (res.success) {
        toast.success(
          `Status updated to ${newStatus}`,
          { id: tid },
        );
        fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(
        err.message || "Failed to update status",
        { id: tid },
      );
    }
  };

  const handleAddPlan = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !newPlan.potential_successor ||
      !newPlan.position_title
    ) {
      return toast.error(
        "All fields are required",
      );
    }

    setSubmitting(true);
    const selectedEmp = employees.find(
      (emp) =>
        emp.id === newPlan.potential_successor,
    );

    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("succession_planning")
        .insert({
          potential_successor:
            newPlan.potential_successor,
          employee_name:
            selectedEmp?.full_name || "Unknown",
          position_title: newPlan.position_title,
          target_role: newPlan.position_title, // populate both for legacy compatibility
          readiness_status:
            newPlan.readiness_status,
          potential_rating:
            newPlan.potential_rating,
        });

      if (error) throw error;

      toast.success("Succession plan added!");
      setIsModalOpen(false);
      setNewPlan({
        potential_successor: "",
        position_title: "",
        readiness_status: "Ready in 1-2 Years",
        potential_rating: 4,
      });
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to add succession plan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this succession candidate?",
      )
    )
      return;
    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("succession_planning")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success(
        "Succession candidate removed",
      );
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to remove candidate",
      );
    }
  };

  const filteredPlans = plans.filter((p) => {
    const emp = (
      p.profiles?.full_name ||
      p.employee_name ||
      ""
    ).toLowerCase();
    const role = (
      p.position_title ||
      p.target_role ||
      ""
    ).toLowerCase();
    const q = searchQuery.toLowerCase();
    return emp.includes(q) || role.includes(q);
  });

  const getReadinessColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ready now":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "ready in 1-2 years":
      case "short_term":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ready in 3-5 years":
      case "medium_term":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const displayReadinessText = (
    status: string,
  ) => {
    if (status === "short_term")
      return "Ready in 1-2 Years";
    if (status === "medium_term")
      return "Ready in 3-5 Years";
    return status;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() =>
                router.push("/hr/dept2")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 bg-white">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <Zap className="h-8 w-8 text-amber-500" />
              Succession Planning
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 pl-11">
              High-potential tracking & role bench
              strength
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-amber-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Add Potential Successor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
              <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
                <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-amber-500" />
                  New Candidate
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                  Identify an employee for future
                  leadership
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleAddPlan}
                className="p-6 md:p-8 space-y-5"
              >
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Potential Successor
                  </Label>
                  <select
                    value={
                      newPlan.potential_successor
                    }
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        potential_successor:
                          e.target.value,
                      })
                    }
                    className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="" disabled>
                      Select an employee...
                    </option>
                    {employees.map((emp) => (
                      <option
                        key={emp.id}
                        value={emp.id}
                      >
                        {emp.full_name ||
                          "Unknown"}{" "}
                        - {emp.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Target Critical Role
                  </Label>
                  <Input
                    required
                    value={newPlan.position_title}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        position_title:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. VP of Engineering"
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-amber-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                    Readiness Status
                  </Label>
                  <select
                    value={
                      newPlan.readiness_status
                    }
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        readiness_status:
                          e.target.value,
                      })
                    }
                    className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Ready Now">
                      Ready Now
                    </option>
                    <option value="Ready in 1-2 Years">
                      Ready in 1-2 Years
                    </option>
                    <option value="Ready in 3-5 Years">
                      Ready in 3-5 Years
                    </option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center pl-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Potential Rating
                    </Label>
                    <span className="text-xs font-black text-amber-600">
                      {newPlan.potential_rating} /
                      5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={
                      newPlan.potential_rating
                    }
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        potential_rating:
                          parseInt(
                            e.target.value,
                          ),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 px-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl font-black bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95 text-base mt-2"
                >
                  {submitting
                    ? "Saving..."
                    : "Save Succession Path"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <Input
            placeholder="Search roles or candidates..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-amber-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col gap-4 p-6 bg-white rounded-[32px] border border-slate-50 shadow-sm">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-100/50 overflow-hidden border border-slate-50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Target Role
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Successor
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Readiness Status
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Potential Rating
                      </th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 relative">
                    {filteredPlans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <span className="font-bold text-slate-700 block truncate">
                            {plan.position_title ||
                              plan.target_role ||
                              "Unknown Role"}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-black text-slate-900 block truncate">
                                {plan.profiles
                                  ?.full_name ||
                                  plan.employee_name ||
                                  "Unknown Candidate"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block truncate mt-0.5">
                                Currently:{" "}
                                {plan.profiles
                                  ?.role ||
                                  "Employee"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <select
                            value={
                              plan.readiness_status
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                plan.id,
                                e.target.value,
                              )
                            }
                            className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight shrink-0 flex w-fit items-center focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer ${getReadinessColor(plan.readiness_status)}`}
                          >
                            <option value="Ready Now">
                              Ready Now
                            </option>
                            <option value="Ready in 1-2 Years">
                              Ready in 1-2 Years
                            </option>
                            <option value="Ready in 3-5 Years">
                              Ready in 3-5 Years
                            </option>
                          </select>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <div
                                  key={star}
                                  className={`h-2 w-2 rounded-full transition-colors ${star <= plan.potential_rating ? "bg-amber-400" : "bg-slate-100"}`}
                                />
                              ),
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {plan.readiness_status ===
                              "Ready Now" && (
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Certificate in
                                Social Recognition
                              </span>
                            )}
                            <button
                              onClick={() =>
                                handleDeletePlan(
                                  plan.id,
                                )
                              }
                              className="h-8 w-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                              title="Remove Candidate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 p-16 text-center">
              <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                No succession plans
              </p>
              <p className="text-slate-400 text-xs mt-2 font-medium">
                Add a new succession candidate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
