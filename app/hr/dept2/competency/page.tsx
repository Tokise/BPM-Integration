"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Eye,
  User,
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

const PROFICIENCY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

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
  const [isDetailModalOpen, setIsDetailModalOpen] =
    useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<string | null>(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    skills: [{ name: "", level: "Beginner" }],
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

  const getAvailableLevels = (currentLevel: string) => {
    const currentIndex = PROFICIENCY_LEVELS.indexOf(currentLevel);
    if (currentIndex === -1) return [PROFICIENCY_LEVELS[0]];

    const available = [currentLevel];
    if (currentIndex < PROFICIENCY_LEVELS.length - 1) {
      available.push(PROFICIENCY_LEVELS[currentIndex + 1]);
    }
    if (currentIndex > 0) {
      available.push(PROFICIENCY_LEVELS[currentIndex - 1]);
    }
    
    return Array.from(new Set(available)).sort((a, b) => 
        PROFICIENCY_LEVELS.indexOf(a) - PROFICIENCY_LEVELS.indexOf(b)
    );
  };

  const getProgressWidth = (level: string) => {
    const index = PROFICIENCY_LEVELS.indexOf(level);
    if (index === -1) return "0%";
    return `${((index + 1) / PROFICIENCY_LEVELS.length) * 100}%`;
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-slate-100 text-slate-700 border-slate-200";
      case "Intermediate": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Advanced": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Expert": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleDeleteCompetency = async (
    id: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
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

  const handleAddSkillField = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: "", level: "Beginner" }],
    });
  };

  const handleRemoveSkillField = (index: number) => {
    const newSkills = [...formData.skills];
    newSkills.splice(index, 1);
    setFormData({ ...formData, skills: newSkills });
  };

  const handleSkillChange = (index: number, field: string, value: string) => {
    const newSkills = [...formData.skills];
    (newSkills[index] as any)[field] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const handleCreateCompetency = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !formData.employee_id ||
      formData.skills.some(s => !s.name)
    ) {
      toast.error(
        "Employee and all Skill Names are required.",
      );
      return;
    }

    setSubmitting(true);

    const selectedEmp = employees.find(
      (emp) => emp.id === formData.employee_id,
    );

    try {
      const records = formData.skills.map(skill => ({
        employee_id: formData.employee_id,
        employee_name: selectedEmp?.full_name || "Unknown",
        skill_name: skill.name,
        proficiency_level: skill.level,
        last_evaluation: new Date().toISOString().split("T")[0],
      }));

      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("competency_management")
        .insert(records);

      if (error) throw error;

      toast.success(
        `${records.length} competency records added successfully!`,
      );
      setIsModalOpen(false);
      setFormData({
        employee_id: "",
        skills: [{ name: "", level: "Beginner" }],
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

  const openDetailModal = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsDetailModalOpen(true);
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

  const selectedEmployeeSkills = competencies.filter(c => c.employee_id === selectedEmployeeId);
  const selectedEmployeeName = selectedEmployeeSkills[0]?.profiles?.full_name || selectedEmployeeSkills[0]?.employee_name || "Employee Details";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto text-slate-900">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-[10px] font-black uppercase tracking-widest"
              >
                <Link href="/hr/dept2">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
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

        <Card className="border shadow-none rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-6 md:p-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50/30">
            <div>
              <CardTitle className="text-xl font-black">
                Employee Skills Directory
              </CardTitle>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                Overview of workforce capabilities
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <Select
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                <SelectTrigger className="w-full md:w-[160px] h-10 bg-white border-slate-200 rounded-xl font-bold text-xs text-slate-600">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    All Levels
                  </SelectItem>
                  {PROFICIENCY_LEVELS.map(level => (
                    <SelectItem
                      key={level}
                      value={level}
                      className="font-bold text-xs uppercase tracking-widest p-3"
                    >
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative group w-full md:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  placeholder="Search employees or skills..."
                  className="pl-9 h-10 bg-white border-slate-200 shadow-none rounded-xl focus-visible:ring-emerald-500 font-medium text-sm"
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
                        Primary Skills
                      </TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Skill Count
                      </TableHead>
                      <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                        const grouped = filteredCompetencies.reduce((acc: any, curr) => {
                            if (!acc[curr.employee_id]) {
                                acc[curr.employee_id] = {
                                    id: curr.employee_id,
                                    name: curr.profiles?.full_name || curr.employee_name || "Unknown",
                                    role: curr.profiles?.role || "Employee",
                                    skills: []
                                };
                            }
                            acc[curr.employee_id].skills.push(curr);
                            return acc;
                        }, {});

                        return Object.values(grouped).map((emp: any) => (
                            <TableRow
                              key={emp.id}
                              onClick={() => openDetailModal(emp.id)}
                              className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                            >
                              <TableCell className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-xs uppercase">
                                        {emp.name[0]}
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-900 block truncate">
                                          {emp.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block truncate mt-0.5">
                                          {emp.role}
                                        </span>
                                    </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-8 py-5">
                                <div className="flex flex-wrap gap-2">
                                    {emp.skills.slice(0, 3).map((s: any) => (
                                        <span key={s.id} className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100">
                                            {s.skill_name}
                                        </span>
                                    ))}
                                    {emp.skills.length > 3 && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                            +{emp.skills.length - 3} more
                                        </span>
                                    )}
                                </div>
                              </TableCell>
                              <TableCell className="px-8 py-5">
                                <span className="font-black text-slate-900">
                                    {emp.skills.length} Skills
                                </span>
                              </TableCell>
                              <TableCell className="px-8 py-5 text-right">
                                <Button
                                  variant="ghost"
                                  className="h-9 px-4 rounded-xl text-emerald-600 font-black hover:bg-emerald-50 flex items-center gap-2 ml-auto"
                                >
                                  View All Skills
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                        ));
                    })()}
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

        {/* Create Competency Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px] bg-white">
            <DialogHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Target className="h-6 w-6 text-emerald-500" />
                    </div>
                  Evaluate Skills
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] pl-13">
                  Record new competencies for an employee
                </DialogDescription>
              </div>
            </DialogHeader>

            <form
              onSubmit={handleCreateCompetency}
              className="p-8 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
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
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                    <Target className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-normal">
                        Select an employee to record their latest skill proficiency levels.
                    </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Skills & Proficiency
                    </Label>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAddSkillField}
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add Skill
                    </Button>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.skills.map((skill, index) => (
                        <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 space-y-1">
                                <Input
                                    placeholder="Skill name..."
                                    value={skill.name}
                                    onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-emerald-500 text-xs"
                                    required
                                />
                            </div>
                            <div className="w-[140px]">
                                <select
                                    value={skill.level}
                                    onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                                    className="flex h-11 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                >
                                    {PROFICIENCY_LEVELS.map(lvl => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                            </div>
                            {formData.skills.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSkillField(index)}
                                    className="h-11 w-11 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 w-full">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-base"
                >
                  {submitting
                    ? "Saving..."
                    : `Log ${formData.skills.length} Competencies`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Employee Detail Modal */}
        <Dialog
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
        >
          <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-2xl rounded-[40px] bg-white">
            <DialogHeader className="p-8 md:p-10 bg-slate-900 text-white relative">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <User className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tighter">
                                    {selectedEmployeeName}
                                </DialogTitle>
                                <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-1">
                                    Comprehensive Skill Profile
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Target className="h-32 w-32 text-white" />
                </div>
            </DialogHeader>

            <div className="p-8 md:p-10 space-y-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedEmployeeSkills.length > 0 ? (
                            selectedEmployeeSkills.map(skill => (
                                <div key={skill.id} className="p-6 rounded-[28px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-black text-slate-900">{skill.skill_name}</h4>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={skill.proficiency_level}
                                                onChange={(e) => handleProficiencyChange(skill.id, e.target.value)}
                                                className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${getProficiencyColor(skill.proficiency_level)}`}
                                            >
                                                {getAvailableLevels(skill.proficiency_level).map(lvl => (
                                                    <option key={lvl} value={lvl}>{lvl}</option>
                                                ))}
                                            </select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => handleDeleteCompetency(skill.id, e)}
                                                className="h-8 w-8 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Proficiency</span>
                                            <span>{skill.proficiency_level}</span>
                                        </div>
                                        <div className="h-2.5 bg-white border border-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                style={{ width: getProgressWidth(skill.proficiency_level) }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Last Evaluated: {skill.last_evaluation}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-slate-400 font-bold uppercase text-[10px]">No skills recorded for this employee.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsDetailModalOpen(false)}
                        className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-12"
                    >
                        Close Profile
                    </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>

        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1;
            }
        `}</style>
      </div>
    </div>
  );
}
