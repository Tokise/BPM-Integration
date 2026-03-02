"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Search,
  Plus,
  TrendingUp,
  UserPlus,
  Award,
  MoreVertical,
  ChevronLeft,
  Users,
  Target,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function SuccessionPlanningPage() {
  const supabase = createClient();
  const router = useRouter();
  const [succession, setSuccession] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newPlan, setNewPlan] = useState({
    employee_name: "",
    target_role: "Manager",
    readiness_status: "medium_term",
    potential_rating: 4,
  });

  useEffect(() => {
    fetchSuccession();

    const channel = supabase
      .channel("succession_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "succession_planning",
        },
        fetchSuccession,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSuccession = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("succession_planning")
      .select("*")
      .order("created_at", { ascending: false });

    setSuccession(data || []);
    setLoading(false);
  };

  const handleAddPlan = async () => {
    if (
      !newPlan.employee_name ||
      !newPlan.target_role
    )
      return toast.error(
        "All fields are required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("succession_planning")
      .insert([newPlan]);

    if (error) {
      toast.error(
        "Failed to add succession plan",
      );
    } else {
      toast.success("Succession plan added");
      setIsModalOpen(false);
      setNewPlan({
        employee_name: "",
        target_role: "Manager",
        readiness_status: "medium_term",
        potential_rating: 4,
      });
      fetchSuccession();
    }
  };

  const filteredPlans = succession.filter(
    (s) =>
      s.employee_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      s.target_role
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "bg-emerald-50 text-emerald-600";
      case "short_term":
        return "bg-blue-50 text-blue-600";
      case "medium_term":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() =>
                router.push("/hr/dept2")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Succession Planning
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              High-potential tracking & role
              readiness bench strength
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-amber-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Add High-Potential
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  New Potential
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="employee"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Employee Name
                  </Label>
                  <Input
                    id="employee"
                    value={newPlan.employee_name}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Robert Wilson"
                    className="rounded-xl border-slate-100 focus:ring-amber-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="role"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Target Role
                  </Label>
                  <Input
                    id="role"
                    value={newPlan.target_role}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        target_role:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Senior Manager"
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="status"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Readiness Status
                  </Label>
                  <select
                    id="status"
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
                    className="flex h-11 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ready">
                      Ready Now
                    </option>
                    <option value="short_term">
                      Short Term (1-2 years)
                    </option>
                    <option value="medium_term">
                      Medium Term (3-5 years)
                    </option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddPlan}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-11"
              >
                Save Plan
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <Input
            placeholder="Search roles or employees..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-amber-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-white rounded-[32px] animate-pulse shadow-sm"
                />
              ))
            : filteredPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all bg-white"
                >
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Zap className="h-6 w-6" />
                      </div>
                      <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                        Succession Path
                      </p>
                      <h3 className="text-xl font-black text-slate-900">
                        {plan.employee_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">
                          {plan.target_role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor(plan.readiness_status)}`}
                      >
                        {plan.readiness_status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                      <div className="flex gap-1">
                        {[...Array(5)].map(
                          (_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full ${i < plan.potential_rating ? "bg-amber-400" : "bg-slate-100"}`}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}
