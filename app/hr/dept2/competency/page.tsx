"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Search,
  Plus,
  ShieldCheck,
  TrendingUp,
  Zap,
  MoreVertical,
  ChevronLeft,
  Users,
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

export default function CompetencyManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [competencies, setCompetencies] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newCompetency, setNewCompetency] =
    useState({
      employee_name: "",
      skill_name: "",
      proficiency_level: "Intermediate",
      last_evaluation: new Date()
        .toISOString()
        .split("T")[0],
    });

  useEffect(() => {
    fetchCompetencies();

    const channel = supabase
      .channel("competency_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "competency_management",
        },
        fetchCompetencies,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompetencies = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("competency_management")
      .select("*")
      .order("created_at", { ascending: false });

    setCompetencies(data || []);
    setLoading(false);
  };

  const handleAddCompetency = async () => {
    if (
      !newCompetency.employee_name ||
      !newCompetency.skill_name
    )
      return toast.error(
        "All fields are required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("competency_management")
      .insert([newCompetency]);

    if (error) {
      toast.error(
        "Failed to add competency record",
      );
    } else {
      toast.success("Competency record added");
      setIsModalOpen(false);
      setNewCompetency({
        employee_name: "",
        skill_name: "",
        proficiency_level: "Intermediate",
        last_evaluation: new Date()
          .toISOString()
          .split("T")[0],
      });
      fetchCompetencies();
    }
  };

  const filteredCompetencies =
    competencies.filter(
      (c) =>
        c.employee_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        c.skill_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );

  const levelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "expert":
        return "bg-purple-50 text-purple-600";
      case "advanced":
        return "bg-blue-50 text-blue-600";
      case "intermediate":
        return "bg-emerald-50 text-emerald-600";
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
              Competency Matrix
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Skills inventory & Proficiency level
              tracking
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-emerald-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Record Evaluation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  New Evaluation
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
                      newCompetency.employee_name
                    }
                    onChange={(e) =>
                      setNewCompetency({
                        ...newCompetency,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Alice Johnson"
                    className="rounded-xl border-slate-100 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="skill"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Skill / Competency
                  </Label>
                  <Input
                    id="skill"
                    value={
                      newCompetency.skill_name
                    }
                    onChange={(e) =>
                      setNewCompetency({
                        ...newCompetency,
                        skill_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Project Management"
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="level"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Proficiency Level
                  </Label>
                  <select
                    id="level"
                    value={
                      newCompetency.proficiency_level
                    }
                    onChange={(e) =>
                      setNewCompetency({
                        ...newCompetency,
                        proficiency_level:
                          e.target.value,
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddCompetency}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11"
              >
                Save Evaluation
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <Input
            placeholder="Search skills or employees..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-emerald-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-white rounded-[32px] animate-pulse shadow-sm"
                />
              ))
            : filteredCompetencies.map((c) => (
                <Card
                  key={c.id}
                  className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all bg-white relative"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Target className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {c.employee_name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {c.skill_name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight ${levelColor(c.proficiency_level)}`}
                        >
                          {c.proficiency_level}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Evaluated:{" "}
                          {c.last_evaluation}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-emerald-500 rounded-full`}
                          style={{
                            width:
                              c.proficiency_level ===
                              "Expert"
                                ? "100%"
                                : c.proficiency_level ===
                                    "Advanced"
                                  ? "75%"
                                  : c.proficiency_level ===
                                      "Intermediate"
                                    ? "50%"
                                    : "25%",
                          }}
                        />
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
