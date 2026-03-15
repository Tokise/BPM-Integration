"use client";

import { useEffect, useState } from "react";
import {
  Scale,
  Search,
  Plus,
  TrendingUp,
  Zap,
  DollarSign,
  MoreVertical,
  ChevronLeft,
  Users,
  PieChart,
  Target,
  Activity,
  Check,
  ChevronsUpDown,
  History as HistoryLink,
  Layers
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CompensationManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (profile?.department as any)?.code;
  const isDept1 = pathname.startsWith("/hr/dept1");
  const isDept2 = pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1 ? "/hr/dept1" : isDept2 ? "/hr/dept2" : "/hr/dept4";
  const [compensation, setCompensation] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newComp, setNewComp] = useState({
    employee_id: "",
    employee_name: "",
    base_salary: 0,
    bonus_percentage: 0,
    last_review: new Date()
      .toISOString()
      .split("T")[0],
    grade_level: "Senior",
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");

  useEffect(() => {
    fetchCompensation();
    fetchEmployees();

    const channel = supabase
      .channel("compensation_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "compensation_management",
        },
        fetchCompensation,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompensation = async () => {
    setLoading(true);
    let query = supabase
      .schema("bpm-anec-global")
      .from("compensation_management")
      .select("*");

    if (isDept1 || isDept2) {
      query = query.eq("employee_id", profile?.id);
    }

    const { data } = await query.order("created_at", { ascending: false });

    setCompensation(data || []);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("id, full_name, role")
      .not("role", "in", '("customer","seller")');
    setEmployees(data || []);
  };

  const handleAddComp = async () => {
    const selectedEmp = employees.find(e => e.id === selectedEmpId);
    if (!selectedEmp || newComp.base_salary <= 0) {
      return toast.error("Please select an employee and valid salary");
    }

    const submission = {
      ...newComp,
      employee_id: selectedEmpId,
      employee_name: selectedEmp.full_name
    };

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("compensation_management")
      .insert([submission]);

    if (error) {
      toast.error("Failed to add record");
    } else {
      toast.success("Compensation record added");
      setIsModalOpen(false);
      setSelectedEmpId("");
      setNewComp({
        employee_id: "",
        employee_name: "",
        base_salary: 0,
        bonus_percentage: 0,
        last_review: new Date()
          .toISOString()
          .split("T")[0],
        grade_level: "Senior",
      });
      fetchCompensation();
    }
  };

  const filteredComp = compensation.filter((c) =>
    c.employee_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href={baseUrl}>
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Compensation & Grades
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Salary Structure Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {[
          { level: "Junior", min: 18000, max: 35000, color: "bg-slate-50 border-slate-200", text: "text-slate-600", icon: TrendingUp },
          { level: "Associate", min: 36000, max: 65000, color: "bg-blue-50 border-blue-100", text: "text-blue-600", icon: Zap },
          { level: "Senior", min: 66000, max: 120000, color: "bg-indigo-50 border-indigo-100", text: "text-indigo-600", icon: Target },
          { level: "Principal", min: 121000, max: 250000, color: "bg-emerald-50 border-emerald-100", text: "text-emerald-600", icon: Activity },
          { level: "Executive", min: 251000, max: 500000, color: "bg-rose-50 border-rose-100", text: "text-rose-600", icon: Users },
        ].map((g, i) => (
          <div key={i} className={`p-5 rounded-lg border ${g.color} flex flex-col gap-3 min-w-[180px] bg-white shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${g.text} opacity-80`}>{g.level}</p>
              <g.icon className={cn("h-3.5 w-3.5", g.text)} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 leading-none tracking-tight">₱{g.min.toLocaleString()} -</span>
              <span className="text-xs font-black text-slate-900 tracking-tight mt-1">₱{g.max.toLocaleString()}</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
               <div className={`h-full bg-slate-900/10 w-full`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Compensation & Grades
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Salary mapping & total rewards
            architecture
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search employees or grades..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-slate-900 font-medium text-xs"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3">
                <Plus className="h-4 w-4" />{" "}
                Adjust Salary
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    Adjustment
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="employee"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Employee Name
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs",
                              !selectedEmpId && "text-muted-foreground"
                            )}
                          >
                            {selectedEmpId
                              ? employees.find(
                                  (e) => e.id === selectedEmpId
                                )?.full_name
                              : "Select employee..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-slate-100 shadow-xl rounded-xl">
                          <Command className="rounded-xl">
                            <CommandInput 
                              placeholder="Search employees..." 
                              className="h-9 font-bold text-xs"
                              value={employeeSearchQuery}
                              onValueChange={setEmployeeSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center text-[10px] font-black uppercase text-slate-400">No employee found.</CommandEmpty>
                              <CommandGroup>
                                {employees
                                  .filter(e => e.full_name?.toLowerCase().includes(employeeSearchQuery.toLowerCase()))
                                  .map((e) => (
                                  <CommandItem
                                    key={e.id}
                                    value={e.id}
                                    onSelect={() => {
                                      setSelectedEmpId(e.id);
                                      setEmployeeSearchQuery("");
                                    }}
                                    className="font-bold text-xs py-3"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedEmpId === e.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {e.full_name}
                                    <span className="ml-2 text-[8px] uppercase tracking-widest text-slate-400">{e.role}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="salary"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Base Salary (₱)
                      </Label>
                      <Input
                        id="salary"
                        type="number"
                        value={
                          newComp.base_salary
                        }
                        onChange={(e) =>
                          setNewComp({
                            ...newComp,
                            base_salary: Number(
                              e.target.value,
                            ),
                          })
                        }
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="level"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Level
                      </Label>
                      <select
                        id="level"
                        value={
                          newComp.grade_level
                        }
                        onChange={(e) =>
                          setNewComp({
                            ...newComp,
                            grade_level:
                              e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-xs focus:outline-none"
                      >
                        <option>Junior</option>
                        <option>Associate</option>
                        <option>Senior</option>
                        <option>Principal</option>
                        <option>Executive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleAddComp}
                  className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-none uppercase tracking-widest text-[10px]"
                >
                  Save Adjustment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 bg-white rounded-lg animate-pulse border border-slate-100"
              />
            ))
          : filteredComp.map((c) => (
              <Card
                key={c.id}
                className="border border-slate-100 shadow-sm rounded-lg overflow-hidden transition-all duration-300 bg-white group hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center border",
                      c.grade_level === "Executive" ? "bg-rose-50 border-rose-100 text-rose-600" :
                      c.grade_level === "Principal" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                      c.grade_level === "Senior" ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                      c.grade_level === "Associate" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-50 border-slate-100 text-slate-600"
                    )}>
                      <Scale className="h-5 w-5" />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="h-8 w-8 rounded-md hover:bg-slate-50 flex items-center justify-center text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1 border-slate-100 shadow-lg rounded-lg">
                         <div className="space-y-1">
                            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-600 transition-colors">Adjust Reward</button>
                            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-[9px] font-black uppercase tracking-widest text-red-500 transition-colors">Reset Policy</button>
                         </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1 mb-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {c.grade_level}
                    </p>
                    <div className="text-lg font-black text-slate-900 tracking-tight">
                      <PrivacyMask
                        value={c.employee_name}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Pay</p>
                          <div className="text-sm font-black text-slate-900 tracking-tight">
                            ₱<PrivacyMask value={(c.base_salary || 0).toLocaleString()} />
                          </div>
                       </div>
                       <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                          <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Bonus</p>
                          <p className="text-sm font-black text-emerald-600 tracking-tight">
                            +{c.bonus_percentage}%
                          </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                       <Activity className="h-3 w-3 text-slate-300" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                         Reviewed: {c.last_review}
                       </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <Button variant="ghost" className="h-8 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-md gap-1.5">
                          <HistoryLink className="h-3 w-3" /> History
                       </Button>
                       <Button variant="ghost" className="h-8 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-md gap-1.5">
                          <Layers className="h-3 w-3" /> Compare
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
