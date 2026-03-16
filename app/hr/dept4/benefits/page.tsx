"use client";

import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Search,
  Plus,
  ShieldCheck,
  Activity,
  Zap,
  MoreVertical,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Heart,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import { toast } from "sonner";
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

export default function BenefitsManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (
    profile?.department as any
  )?.code;
  const isDept1 =
    pathname.startsWith("/hr/dept1");
  const isDept2 =
    pathname.startsWith("/hr/dept2");
  const isDept3 =
    pathname.startsWith("/hr/dept3");
  const isLogistics = profile?.role
    ?.toLowerCase()
    .startsWith("logistic");
  const isFinance = profile?.role
    ?.toLowerCase()
    .startsWith("finance");
  const baseUrl = pathname.startsWith("/finance")
    ? "/finance"
    : pathname.startsWith("/logistic/dept1")
      ? "/logistic/dept1"
      : pathname.startsWith(
            "/logistic/dept2/driver",
          )
        ? "/logistic/dept2/driver"
        : pathname.startsWith("/logistic/dept2")
          ? "/logistic/dept2"
          : isDept1
            ? "/hr/dept1"
            : isDept2
              ? "/hr/dept2"
              : isDept3
                ? "/hr/dept3"
                : "/hr/dept4";
  const [benefits, setBenefits] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newBenefit, setNewBenefit] =
    useState<any>({
      employee_id: "",
      employee_name: "",
      benefit_type: "HMO Platinum",
      coverage_amount: 250000,
      status: "active",
      enrollment_date: new Date()
        .toISOString()
        .split("T")[0],
      category: "HMO",
    });
  const [allowanceRecords, setAllowanceRecords] =
    useState<any[]>([]);
  const [selectedUsage, setSelectedUsage] =
    useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] =
    useState(false);
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [
    employeeSearchQuery,
    setEmployeeSearchQuery,
  ] = useState("");
  const [selectedEmpId, setSelectedEmpId] =
    useState<string>("");

  useEffect(() => {
    fetchBenefits();
    fetchEmployees();

    const channel = supabase
      .channel("benefits_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "hmo_benefits",
        },
        fetchBenefits,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]); // Added profile?.id to dependency to re-fetch when user loads

  const fetchBenefits = async () => {
    if (!profile?.id) return;
    setLoading(true);
    let query = supabase
      .schema("bpm-anec-global")
      .from("hmo_benefits")
      .select("*, profiles(full_name, role)");

    // Strict Personal View for Integrated Departments or Employees
    if (
      profile?.role === "employee" ||
      profile?.role === "hr4_employee" ||
      isLogistics ||
      isFinance ||
      isDept1 ||
      isDept2 ||
      isDept3
    ) {
      query = query.eq(
        "employee_id",
        profile?.id,
      );
    }

    const { data } = await query.order(
      "created_at",
      {
        ascending: false,
      },
    );

    setBenefits(data || []);
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

  const handleAddBenefit = async () => {
    const selectedEmp = employees.find(
      (e) => e.id === selectedEmpId,
    );
    if (
      !selectedEmp &&
      profile?.role !== "employee"
    ) {
      return toast.error(
        "Please select an employee",
      );
    }

    const submission = {
      ...newBenefit,
      employee_id:
        profile?.role === "employee"
          ? profile?.id
          : selectedEmpId,
      employee_name:
        profile?.role === "employee"
          ? profile?.full_name
          : selectedEmp?.full_name,
      benefit_type: newBenefit.benefit_type,
      coverage_amount: Number(newBenefit.coverage_amount) || 0,
      status: "active",
      enrollment_date: newBenefit.enrollment_date || new Date().toISOString().split("T")[0],
      category: newBenefit.category
    };

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("hmo_benefits")
      .insert([submission]);

    if (error) {
      toast.error("Failed to enroll employee");
    } else {
      toast.success(
        "Employee enrolled in benefit plan",
      );
      setIsModalOpen(false);
      setSelectedEmpId("");
      setNewBenefit({
        employee_id: "",
        employee_name: "",
        benefit_type: "HMO Platinum",
        coverage_amount: 250000,
        status: "active",
        enrollment_date: new Date()
          .toISOString()
          .split("T")[0],
      });
      fetchBenefits();
    }
  };

  const filteredBenefits = benefits.filter(
    (b) =>
      b.employee_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      b.benefit_type
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      b.benefit_name
        ?.toLowerCase()
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
              Benefits & HMO
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Benefits & HMO
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Employee wellness & Corporate perks
            administration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <Input
              placeholder="Search employees or plans..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-emerald-500 font-medium text-xs shadow-none"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          {!isDept1 &&
            !isDept2 &&
            !isDept3 &&
            !isLogistics &&
            !isFinance && (
              <Dialog
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3">
                    <Plus className="h-4 w-4" />{" "}
                    New Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
                  <div className="p-8 space-y-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                        Enrollment
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
                        {profile?.role ===
                        "employee" ? (
                          <Input
                            id="employee"
                            value={
                              profile?.full_name
                            }
                            disabled
                            className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                          />
                        ) : (
                          <Popover>
                            <PopoverTrigger
                              asChild
                            >
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs",
                                  !selectedEmpId &&
                                    "text-muted-foreground",
                                )}
                              >
                                {selectedEmpId
                                  ? employees.find(
                                      (e) =>
                                        e.id ===
                                        selectedEmpId,
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
                                  value={
                                    employeeSearchQuery
                                  }
                                  onValueChange={
                                    setEmployeeSearchQuery
                                  }
                                />
                                <CommandList>
                                  <CommandEmpty className="py-6 text-center text-[10px] font-black uppercase text-slate-400">
                                    No employee
                                    found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {employees
                                      .filter(
                                        (e) =>
                                          e.full_name
                                            ?.toLowerCase()
                                            .includes(
                                              employeeSearchQuery.toLowerCase(),
                                            ),
                                      )
                                      .map(
                                        (e) => (
                                          <CommandItem
                                            key={
                                              e.id
                                            }
                                            value={
                                              e.id
                                            }
                                            onSelect={() => {
                                              setSelectedEmpId(
                                                e.id,
                                              );
                                              setEmployeeSearchQuery(
                                                "",
                                              );
                                            }}
                                            className="font-bold text-xs py-3"
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedEmpId ===
                                                  e.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {
                                              e.full_name
                                            }
                                            <span className="ml-2 text-[8px] uppercase tracking-widest text-slate-400">
                                              {
                                                e.role
                                              }
                                            </span>
                                          </CommandItem>
                                        ),
                                      )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label
                          htmlFor="category"
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                          Benefit Category
                        </Label>
                        <select
                          id="category"
                          value={
                            newBenefit.category
                          }
                          onChange={(e) =>
                            setNewBenefit({
                              ...newBenefit,
                              category:
                                e.target.value,
                              benefit_type: "", // Reset benefit type when category changes
                            })
                          }
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-xs focus:outline-none"
                        >
                          <option value="">
                            Select Category
                          </option>
                          <option value="HMO">
                            HMO
                          </option>
                          <option value="Insurance">
                            Insurance
                          </option>
                          <option value="Allowance">
                            Allowance
                          </option>
                          <option value="Perk">
                            Perk
                          </option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label
                          htmlFor="type"
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                          Plan Type
                        </Label>
                        <select
                          id="type"
                          value={
                            newBenefit.benefit_type
                          }
                          onChange={(e) =>
                            setNewBenefit({
                              ...newBenefit,
                              benefit_type:
                                e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-xs focus:outline-none"
                        >
                          <option value="">
                            Select Plan Type
                          </option>
                          {newBenefit.category ===
                            "HMO" && (
                            <>
                              <option>
                                HMO Platinum Plus
                              </option>
                              <option>
                                HMO Executive
                              </option>
                            </>
                          )}
                          {newBenefit.category ===
                            "Insurance" && (
                            <>
                              <option>
                                Life Insurance
                                Gold
                              </option>
                              <option>
                                Accident Insurance
                                Silver
                              </option>
                            </>
                          )}
                          {newBenefit.category ===
                            "Allowance" && (
                            <>
                              <option>
                                Rice Subsidy
                              </option>
                              <option>
                                Clothing Allowance
                              </option>
                            </>
                          )}
                          {newBenefit.category ===
                            "Perk" && (
                            <>
                              <option>
                                Gym Membership
                                Premium
                              </option>
                              <option>
                                Wellness Program
                                Access
                              </option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <Button
                      onClick={handleAddBenefit}
                      className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-none uppercase tracking-widest text-[10px]"
                    >
                      Confirm Enrollment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-200 shadow-xl shadow-slate-100 rounded-3xl bg-indigo-600 text-white overflow-hidden p-8 flex flex-col justify-between group">
          <div>
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Corporate HMO Pool
            </h4>
            <h2 className="text-3xl font-black mt-1 tracking-tighter italic">
              ₱ 4.5M
            </h2>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-80">
            <Activity className="h-3 w-3" />{" "}
            System Managed
          </div>
        </Card>

        {allowanceRecords
          .slice(0, 3)
          .map((a: any, i: number) => (
            <Card
              key={i}
              className="border border-slate-200 shadow-none rounded-3xl bg-white overflow-hidden p-8 flex flex-col justify-between group"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {a.type}
                </h4>
                <h2 className="text-2xl font-black mt-1 text-slate-900 tracking-tighter italic">
                  ₱ {a.amount.toLocaleString()}
                </h2>
              </div>
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {a.frequency}
              </p>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white rounded-lg animate-pulse border border-slate-100"
            />
          ))
        ) : filteredBenefits.length > 0 ? (
          filteredBenefits.map((b) => (
            <Card
              key={b.id}
              className="border border-slate-200 shadow-none rounded-xl overflow-hidden group transition-all bg-white relative"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-black border border-slate-100 text-sm">
                    {b.benefit_name?.charAt(0) ||
                      "B"}
                  </div>
                  {!isDept1 &&
                    !isDept2 &&
                    !isDept3 &&
                    !isLogistics &&
                    !isFinance && (
                      <button className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    )}
                </div>
                <div className="space-y-1 mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {b.benefit_type}
                  </p>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter transition-all group-hover:text-black">
                    {b.benefit_name ||
                      b.benefit_type}
                  </h3>
                </div>
                <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 font-bold">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 border border-slate-200">
                    {(
                      b.profiles?.full_name ||
                      b.employee_name
                    )?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">
                      <PrivacyMask
                        value={
                          b.profiles?.full_name ||
                          b.employee_name
                        }
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {b.profiles?.role ||
                        "Employee"}
                    </p>
                  </div>
                  <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100 shrink-0">
                    Active
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Since {b.enrollment_date}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedUsage([
                        {
                          date: "2023-10-12",
                          detail:
                            "Outpatient Consultation",
                          amount: "₱1,200",
                          provider:
                            "HMO-Platinum",
                        },
                        {
                          date: "2023-09-05",
                          detail:
                            "Laboratory Tests",
                          amount: "₱4,500",
                          provider:
                            "HMO-Platinum",
                        },
                        {
                          date: "2023-08-14",
                          detail:
                            "General Checkup",
                          amount: "₱800",
                          provider:
                            "HMO-Platinum",
                        },
                      ]);
                      setIsHistoryOpen(true);
                    }}
                    className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-3 h-8 rounded-lg flex items-center gap-2"
                  >
                    <Zap className="h-3 w-3" />{" "}
                    History
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 p-0 h-auto"
                  >
                    View Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
              No current benefits
            </p>
            <p className="text-slate-400 text-xs mt-3 font-medium">
              Your active benefits and insurance
              plans will be listed here once
              enrolled.
            </p>
          </div>
        )}
      </div>

      {/* Benefit Usage History Dialog */}
      <Dialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      >
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
          <div className="bg-indigo-600 p-8 text-white">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">
              Benefit Usage History
            </h2>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-1">
              Audit Trail & Utilization Ledger
            </p>
          </div>
          <div className="p-8 space-y-4">
            {selectedUsage.map(
              (u: any, i: number) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {u.date}
                    </p>
                    <p className="text-xs font-black text-slate-900">
                      {u.detail}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {u.provider}
                    </p>
                  </div>
                  <span className="text-sm font-black text-indigo-600">
                    {u.amount}
                  </span>
                </div>
              ),
            )}
          </div>
          <div className="p-8 bg-white border-t border-slate-100 text-center">
            <Button
              className="w-full bg-slate-900 text-white font-black rounded-xl h-12 uppercase tracking-widest text-[10px]"
              onClick={() =>
                setIsHistoryOpen(false)
              }
            >
              Acknowledge Records
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
