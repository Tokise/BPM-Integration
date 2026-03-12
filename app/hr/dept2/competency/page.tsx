"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Search,
  Plus,
  ChevronLeft,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { updateCompetencyLevel } from "@/app/actions/hr";

export default function CompetencyManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [competencies, setCompetencies] =
    useState<any[]>([]);
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] =
    useState("");
  const [levelFilter, setLevelFilter] =
    useState("all");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    skill_name: "",
    proficiency_level: "Beginner",
  });
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("competency_sync_updated")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "competency_management",
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
    // Fetch employees for select dropdown
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

    // Fetch competencies
    const { data: compData, error: compError } =
      await supabase
        .schema("bpm-anec-global")
        .from("competency_management")
        .select(
          `
        id,
        skill_name,
        proficiency_level,
        last_evaluation,
        employee_id,
        employee_name,
        profiles!competency_management_employee_id_fkey (role, full_name)
      `,
        )
        .order("created_at", {
          ascending: false,
        });

    if (compError) {
      console.error(
        "Error fetching competencies:",
        compError,
      );
      toast.error("Failed to load competencies");
    }

    if (empData) setEmployees(empData);
    if (compData) setCompetencies(compData);
    setLoading(false);
  };

  const handleProficiencyChange = async (
    id: string,
    newLevel: string,
  ) => {
    const tid = toast.loading(
      "Updating proficiency...",
    );
    try {
      const res = await updateCompetencyLevel(
        id,
        newLevel,
      );
      if (res.success) {
        toast.success(
          `Proficiency updated to ${newLevel}`,
          { id: tid },
        );
        fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to update proficiency",
        { id: tid },
      );
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "expert":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "advanced":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "intermediate":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "beginner":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getProgressWidth = (level: string) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "25%";
      case "intermediate":
        return "50%";
      case "advanced":
        return "75%";
      case "expert":
        return "100%";
      default:
        return "0%";
    }
  };

  const handleDeleteCompetency = async (
    id: string,
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this competency record?",
      )
    )
      return;
    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("competency_management")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Competency record deleted");
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to delete competency",
      );
    }
  };

  const handleCreateCompetency = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !formData.employee_id ||
      !formData.skill_name
    ) {
      toast.error(
        "Employee and Skill Name are required.",
      );
      return;
    }

    setSubmitting(true);

    const selectedEmp = employees.find(
      (emp) => emp.id === formData.employee_id,
    );

    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("competency_management")
        .insert({
          employee_id: formData.employee_id,
          employee_name:
            selectedEmp?.full_name || "Unknown",
          skill_name: formData.skill_name,
          proficiency_level:
            formData.proficiency_level,
          last_evaluation: new Date()
            .toISOString()
            .split("T")[0],
        });

      if (error) throw error;

      toast.success(
        "Competency record added successfully!",
      );
      setIsModalOpen(false);
      setFormData({
        employee_id: "",
        skill_name: "",
        proficiency_level: "Beginner",
      });
      fetchData();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to add competency.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompetencies =
    competencies.filter((c) => {
      const term = searchTerm.toLowerCase();
      const empName = (
        c.profiles?.full_name ||
        c.employee_name ||
        ""
      ).toLowerCase();
      const skill = (
        c.skill_name || ""
      ).toLowerCase();
      const matchesSearch =
        empName.includes(term) ||
        skill.includes(term);
      const matchesLevel =
        levelFilter === "all" ||
        c.proficiency_level === levelFilter;
      return matchesSearch && matchesLevel;
    });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/hr/dept2">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                Competency Matrix
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <Target className="h-8 w-8 text-emerald-500" />
              Competency Matrix
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 pl-11">
              Skill tracking & proficiency
              evaluations
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Evaluation
          </Button>
        </div>

        <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-6 md:p-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50/50">
            <div>
              <CardTitle className="text-xl font-black">
                Employee Skills Directory
              </CardTitle>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                Detailed breakdown of workforce
                capabilities
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <Select
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                <SelectTrigger className="w-full md:w-[160px] h-10 bg-transparent border-slate-200 rounded-xl font-bold text-xs text-slate-600">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    All Levels
                  </SelectItem>
                  <SelectItem
                    value="Beginner"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    Beginner
                  </SelectItem>
                  <SelectItem
                    value="Intermediate"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    Intermediate
                  </SelectItem>
                  <SelectItem
                    value="Advanced"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    Advanced
                  </SelectItem>
                  <SelectItem
                    value="Expert"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    Expert
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative group w-full md:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  placeholder="Search skills..."
                  className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-xl focus-visible:ring-emerald-500 font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 border-none">
                <div className="flex flex-col gap-4 p-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-slate-50 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : filteredCompetencies.length >
              0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Employee
                      </TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Skill / Tool
                      </TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Proficiency
                      </TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Last Evaluated
                      </TableHead>
                      <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompetencies.map(
                      (c) => (
                        <TableRow
                          key={c.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <TableCell className="px-8 py-5">
                            <span className="font-black text-slate-900 block truncate">
                              {c.profiles
                                ?.full_name ||
                                c.employee_name ||
                                "Unknown"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block truncate mt-0.5">
                              {c.profiles?.role ||
                                "Employee"}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-5">
                            <span className="font-bold text-slate-700 block truncate">
                              {c.skill_name}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-3 w-48">
                              <select
                                value={
                                  c.proficiency_level
                                }
                                onChange={(e) =>
                                  handleProficiencyChange(
                                    c.id,
                                    e.target
                                      .value,
                                  )
                                }
                                className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${getProficiencyColor(c.proficiency_level)}`}
                              >
                                <option value="Beginner">
                                  Beginner
                                </option>
                                <option value="Intermediate">
                                  Intermediate
                                </option>
                                <option value="Advanced">
                                  Advanced
                                </option>
                                <option value="Expert">
                                  Expert
                                </option>
                              </select>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                  style={{
                                    width:
                                      getProgressWidth(
                                        c.proficiency_level,
                                      ),
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">
                            {c.last_evaluation ||
                              "No date"}
                          </TableCell>
                          <TableCell className="px-8 py-5 text-right">
                            <button
                              onClick={() =>
                                handleDeleteCompetency(
                                  c.id,
                                )
                              }
                              className="h-8 w-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors ml-auto"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-16 text-center">
                <Target className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                  No competencies found
                </p>
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  Adjust your search or add a new
                  evaluation record.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
            <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Target className="h-6 w-6 text-emerald-500" />
                Evaluate Skill
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                Record a new competency for an
                employee
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleCreateCompetency}
              className="p-6 md:p-8 space-y-6"
            >
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Target Employee
                </Label>
                <select
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employee_id: e.target.value,
                    })
                  }
                  className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      {emp.full_name || "Unknown"}{" "}
                      - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Skill or Tool Name
                </Label>
                <Input
                  placeholder="e.g. Project Management, React.js"
                  value={formData.skill_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skill_name: e.target.value,
                    })
                  }
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                  Proficiency Level
                </Label>
                <select
                  value={
                    formData.proficiency_level
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proficiency_level:
                        e.target.value,
                    })
                  }
                  className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="Beginner">
                    Beginner (1/4)
                  </option>
                  <option value="Intermediate">
                    Intermediate (2/4)
                  </option>
                  <option value="Advanced">
                    Advanced (3/4)
                  </option>
                  <option value="Expert">
                    Expert (4/4)
                  </option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 w-full">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-base"
                >
                  {submitting
                    ? "Saving..."
                    : "Log Competency"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
