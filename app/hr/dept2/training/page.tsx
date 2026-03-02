"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus,
  Search,
  ChevronLeft,
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

export default function TrainingManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [training, setTraining] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newTraining, setNewTraining] = useState({
    employee_name: "",
    training_name: "",
    status: "pending",
    completion_date: null as string | null,
  });

  useEffect(() => {
    fetchTraining();

    const channel = supabase
      .channel("training_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "training_management",
        },
        fetchTraining,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTraining = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("training_management")
      .select("*")
      .order("created_at", { ascending: false });

    setTraining(data || []);
    setLoading(false);
  };

  const handleAddTraining = async () => {
    if (
      !newTraining.employee_name ||
      !newTraining.training_name
    )
      return toast.error(
        "All fields are required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("training_management")
      .insert([newTraining]);

    if (error) {
      toast.error(
        "Failed to add training record",
      );
    } else {
      toast.success("Training record added");
      setIsModalOpen(false);
      setNewTraining({
        employee_name: "",
        training_name: "",
        status: "pending",
        completion_date: null,
      });
      fetchTraining();
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
  ) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("training_management")
      .update({
        status,
        completion_date:
          status === "completed"
            ? new Date()
                .toISOString()
                .split("T")[0]
            : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Training ${status}`);
    }
  };

  const filteredTraining = training.filter(
    (t) =>
      t.employee_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      t.training_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

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
              Training Sessions
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Employee skills development &
              certification tracking
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Assign Training
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Assign Training
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
                    value={
                      newTraining.employee_name
                    }
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. John Doe"
                    className="rounded-xl border-slate-100 focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="training"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Training Name
                  </Label>
                  <Input
                    id="training"
                    value={
                      newTraining.training_name
                    }
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        training_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Cybersecurity Fundamentals"
                    className="rounded-xl border-slate-100"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddTraining}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-11"
              >
                Assign Record
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            placeholder="Search employees or courses..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-blue-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-100/50 overflow-hidden border border-slate-50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Employee
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Training Module
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-50"
                    >
                      <td
                        colSpan={5}
                        className="px-8 py-6 h-16 bg-white/50"
                      />
                    </tr>
                  ))
                : filteredTraining.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            {t.employee_name.charAt(
                              0,
                            )}
                          </div>
                          <span className="font-bold text-slate-900">
                            {t.employee_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            {t.training_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            t.status ===
                            "completed"
                              ? "bg-emerald-50 text-emerald-600"
                              : t.status ===
                                  "in_progress"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {t.status.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-400">
                          {t.completion_date ||
                            "---"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {t.status !==
                            "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(
                                  t.id,
                                  "completed",
                                )
                              }
                              className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filteredTraining.length === 0 &&
            !loading && (
              <div className="p-12 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                  No training found
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
