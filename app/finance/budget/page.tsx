"use client";

import {
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Filter,
  ShieldCheck,
  CheckCircle,
  Clock,
  User,
  GraduationCap,
  Briefcase,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Calculator,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import { generateAndSendOTP } from "@/app/actions/auth_otp";
import { useUser } from "@/context/UserContext";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { logTransaction } from "@/app/actions/hr";
import { notifyDepartment } from "@/app/actions/notifications";

export default function BudgetManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);

  // Unified Approval State
  const [pendingRecruitment, setPendingRecruitment] = useState<any[]>([]);
  const [pendingPayroll, setPendingPayroll] = useState<any[]>([]);
  const [pendingTraining, setPendingTraining] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  // OTP and Action States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<{
    type: 'recruitment' | 'payroll' | 'training';
    id: string;
    amount: number;
    title: string;
  } | null>(null);

  // Modal specific states
  const [isRecruitmentModalOpen, setIsRecruitmentModalOpen] = useState(false);
  const [recruitmentBudget, setRecruitmentBudget] = useState("");

  // Real data for Platform Revenue (Actuals)
  const [actualYtdRevenue, setActualYtdRevenue] =
    useState(0);
  const [monthlyActuals, setMonthlyActuals] =
    useState<
      {
        month: string;
        actualRev: number;
        actualExp: number;
      }[]
    >([]);

  // Simulated Budget State (Since we don't have a budgets table, we'll store this in state/localStorage for demo)
  const [
    annualRevenueTarget,
    setAnnualRevenueTarget,
  ] = useState(500000);
  const [
    annualExpenseBudget,
    setAnnualExpenseBudget,
  ] = useState(300000);

  // Real data for Departments and Budgets
  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [allDepts, setAllDepts] = useState<any[]>(
    [],
  ); // For the allocation dropdown

  // New Allocation Form State
  const [newAlloc, setNewAlloc] = useState({
    deptId: "",
    amount: "",
    year: new Date().getFullYear().toString(),
  });
  const [isDialogOpen, setIsDialogOpen] =
    useState(false);

  // Forecasting Sliders
  const [growthAssumption, setGrowthAssumption] =
    useState(5); // 5% MoM growth assumption

  async function fetchData() {
    setLoading(true);
    
    // Fetch operational pending requests
    const [recRes, payRes, trnRes] = await Promise.all([
      supabase.schema("bpm-anec-global").from("recruitment_management").select("*, departments(name)").eq("status", "draft"),
      supabase.schema("bpm-anec-global").from("payroll_management").select("*, profiles(full_name)").eq("status", "budget_requested"),
      supabase.schema("bpm-anec-global").from("training_events").select("*").eq("budget_status", "pending_finance")
    ]);

    setPendingRecruitment(recRes.data || []);
    setPendingPayroll(payRes.data || []);
    setPendingTraining(trnRes.data || []);
    
    // Fetch recent audit logs
    const { data: logsData } = await supabase
      .schema("bpm-anec-global")
      .from("audit_logs")
      .select("*")
      .like("action", "budget_%")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentLogs(logsData || []);

    // Fetch departments
    const { data: deptData } = await supabase
      .schema("bpm-anec-global")
      .from("departments")
      .select("*");
    setAllDepts(deptData || []);

    // Fetch budgets for current year
    const { data: budgetsData } = await supabase
      .schema("bpm-anec-global")
      .from("budgets")
      .select("*")
      .eq(
        "fiscal_year",
        new Date().getFullYear(),
      );

    // Fetch payouts to calculate actual platform revenue
    const { data: payouts } = await supabase
      .schema("bpm-anec-global")
      .from("payout_management")
      .select(
        "amount, commission_fee, payment_processing_fee, withholding_tax, status, processed_at, created_at",
      )
      .in("status", ["approved", "completed"]);

    const all = payouts || [];
    const totalRev = all.reduce(
      (a, p) =>
        a +
        Number(p.commission_fee || 0) +
        Number(p.payment_processing_fee || 0) +
        Number(p.withholding_tax || 0),
      0,
    );
    setActualYtdRevenue(totalRev);

    // Map departments with their budgets
    const mappedDepts = (deptData || []).map(
      (d) => {
        const b = (budgetsData || []).find(
          (b) => b.department_id === d.id,
        );
        return {
          id: d.id,
          name: d.name,
          allocated: Number(
            b?.allocated_amount || 0,
          ),
          spent: Number(
            b
              ? b.allocated_amount -
                  (b.remaining_amount || 0)
              : 0,
          ),
        };
      },
    );
    setDepartments(mappedDepts);

    // Aggregate by month (last 6 months)
    const now = new Date();
    const monthsMap: Record<
      string,
      { rev: number; exp: number }
    > = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      );
      monthsMap[
        d.toLocaleDateString(undefined, {
          month: "short",
        })
      ] = { rev: 0, exp: 0 };
    }

    all.forEach((p: any) => {
      const dateStr =
        p.processed_at || p.created_at;
      if (dateStr) {
        const key = new Date(
          dateStr,
        ).toLocaleDateString(undefined, {
          month: "short",
        });
        if (monthsMap[key]) {
          monthsMap[key].rev +=
            Number(p.commission_fee || 0) +
            Number(
              p.payment_processing_fee || 0,
            ) +
            Number(p.withholding_tax || 0);
          if (p.status === "completed")
            monthsMap[key].exp += Number(
              p.amount,
            );
        }
      }
    });

    setMonthlyActuals(
      Object.entries(monthsMap).map(
        ([month, d]) => ({
          month,
          actualRev: d.rev,
          actualExp: d.exp,
        }),
      ),
    );
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const handleSaveAllocation = async () => {
    if (!newAlloc.deptId || !newAlloc.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("budgets")
      .insert({
        department_id: newAlloc.deptId,
        allocated_amount: Number(newAlloc.amount),
        remaining_amount: Number(newAlloc.amount),
        fiscal_year: Number(newAlloc.year),
      });

    if (error) {
      toast.error("Failed to save allocation");
      console.error(error);
    } else {
      toast.success(
        "Allocation saved successfully",
      );
      setIsDialogOpen(false);
      setNewAlloc({
        ...newAlloc,
        deptId: "",
        amount: "",
      });
      
      await logTransaction({
        userId: profile!.id,
        action: "budget_allocation",
        entityType: "budget",
        entityId: newAlloc.deptId,
        details: { amount: newAlloc.amount, year: newAlloc.year }
      });

      fetchData();
    }
  };

  // Unified Approval Handlers
  const handleInitiateApproval = async (type: 'recruitment' | 'payroll' | 'training', id: string, amount: number, title: string) => {
    setActiveRequest({ type, id, amount, title });
    
    if (type === 'recruitment') {
      setIsRecruitmentModalOpen(true);
      return;
    }

    // Direct OTP send for others
    const toastId = toast.loading("Sending security code...");
    const res = await generateAndSendOTP(profile!.id, profile!.email!);
    if (res.success) {
      toast.success("Security code sent!", { id: toastId });
      setIsOtpModalOpen(true);
    } else {
      toast.error(res.error, { id: toastId });
    }
  };

  const handleVerifyAndApprove = async () => {
    if (otpValue.length < 6) return toast.error("Enter a valid code");
    setIsSubmitting(true);

    try {
      // 1. Verify OTP
      const { data: otpData, error: otpError } = await supabase
        .schema("bpm-anec-global")
        .from("user_otps")
        .select("*")
        .eq("user_id", profile!.id)
        .eq("otp_code", otpValue.toUpperCase())
        .eq("is_verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpData) {
        throw new Error("Invalid or expired verification code.");
      }

      await supabase.schema("bpm-anec-global").from("user_otps").update({ is_verified: true }).eq("id", otpData.id);

      // 2. Perform Action
      let updateError;
      if (activeRequest?.type === 'recruitment') {
        const { error } = await supabase.schema("bpm-anec-global").from("recruitment_management")
          .update({ budget: Number(recruitmentBudget), status: "budget_approved" })
          .eq("id", activeRequest.id);
        updateError = error;
      } else if (activeRequest?.type === 'payroll') {
        const { error } = await supabase.schema("bpm-anec-global").from("payroll_management")
          .update({ status: "budget_approved" }) // Adjust status based on actual table schema flow
          .eq("id", activeRequest.id);
        updateError = error;
      } else if (activeRequest?.type === 'training') {
        const { error } = await supabase.schema("bpm-anec-global").from("training_events")
          .update({ budget_status: "approved" })
          .eq("id", activeRequest.id);
        updateError = error;
      }

      if (updateError) throw updateError;

      toast.success(`${activeRequest?.title} approved!`);
      setIsOtpModalOpen(false);
      setOtpValue("");

      await logTransaction({
        userId: profile!.id,
        action: `budget_approval_${activeRequest?.type}`,
        entityType: activeRequest?.type,
        entityId: activeRequest?.id,
        details: { 
          amount: activeRequest?.amount, 
          title: activeRequest?.title,
          ...(activeRequest?.type === 'recruitment' && { final_salary: recruitmentBudget })
        }
      });

      if (activeRequest?.type === "recruitment") {
        await notifyDepartment({
          deptCode: "HR_DEPT1",
          title: "Budget Approved",
          message: `The budget for "${activeRequest.title}" has been approved. You can now publish the job posting.`
        });
      }

      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Budget calculations
  const totalAllocated = departments.reduce(
    (a, d) => a + d.allocated,
    0,
  );
  const totalSpent = departments.reduce(
    (a, d) => a + d.spent,
    0,
  );
  const remainingBudget = Math.max(
    0,
    annualExpenseBudget - totalSpent,
  );

  // Variance Analysis
  const currentMonthIdx = Math.max(
    0,
    monthlyActuals.length - 1,
  );
  const expectedMonthlyRev =
    annualRevenueTarget / 12;
  const currentMonthRev =
    monthlyActuals[currentMonthIdx]?.actualRev ||
    0;
  const revVariance =
    currentMonthRev - expectedMonthlyRev;

  // Forecasting Chart (Next 3 Months)
  const forecastData = useMemo(() => {
    if (monthlyActuals.length === 0) return [];
    const lastRev =
      monthlyActuals[currentMonthIdx]
        ?.actualRev || 1000;
    const res = [];
    let current = lastRev;
    for (let i = 1; i <= 3; i++) {
      const now = new Date();
      now.setMonth(now.getMonth() + i);
      current =
        current * (1 + growthAssumption / 100);
      res.push({
        month: now.toLocaleDateString(undefined, {
          month: "short",
        }),
        projectedRev: current,
      });
    }
    return res;
  }, [
    monthlyActuals,
    growthAssumption,
    currentMonthIdx,
  ]);

  if (loading) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/finance">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Budget & Forecasting
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Budget Control
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Planning & Variance • Finance Dept
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search budgets..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-slate-900 font-medium text-xs shadow-none"
            />
          </div>
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-black rounded-lg h-10 px-6 hover:bg-slate-50 uppercase tracking-widest text-[10px] shadow-none"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Dialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px]">
                New Allocation
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg border-none shadow-2xl p-0 overflow-hidden max-w-md bg-white">
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">
                    Budget Allocation
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Target Department
                    </Label>
                    <Select
                      value={newAlloc.deptId}
                      onValueChange={(v) =>
                        setNewAlloc({
                          ...newAlloc,
                          deptId: v,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-lg border-slate-100 bg-slate-50 font-bold">
                        <SelectValue placeholder="Select Dept..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-50 shadow-2xl">
                        {allDepts.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={d.id}
                            className="font-bold"
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Allocation Amount (₱)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="h-12 rounded-lg border-slate-100 bg-slate-50 font-bold"
                      value={newAlloc.amount}
                      onChange={(e) =>
                        setNewAlloc({
                          ...newAlloc,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Fiscal Year
                    </Label>
                    <Input
                      type="number"
                      className="h-12 rounded-lg border-slate-100 bg-slate-50 font-bold"
                      value={newAlloc.year}
                      onChange={(e) =>
                        setNewAlloc({
                          ...newAlloc,
                          year: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleSaveAllocation}
                    className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest"
                  >
                    Confirm Allocation
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* === TOP KPI ROW === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden group bg-white relative">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
              Annual Target
            </p>
            <h3 className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">
              <PrivacyMask
                value={fmt(annualRevenueTarget)}
              />
            </h3>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                <span>
                  YTD: {fmt(actualYtdRevenue)}
                </span>
                <span>
                  {(
                    (actualYtdRevenue /
                      annualRevenueTarget) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min((actualYtdRevenue / annualRevenueTarget) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden group bg-white relative">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Briefcase className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
              Operating Budget
            </p>
            <h3 className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">
              <PrivacyMask
                value={fmt(annualExpenseBudget)}
              />
            </h3>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                <span>
                  Spent: {fmt(totalSpent)}
                </span>
                <span>
                  {(
                    (totalSpent /
                      annualExpenseBudget) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${Math.min((totalSpent / annualExpenseBudget) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden group bg-white relative">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
              Remaining
            </p>
            <h3 className="text-3xl font-black text-emerald-600 leading-none uppercase tracking-tighter">
              <PrivacyMask
                value={fmt(remainingBudget)}
              />
            </h3>
            <div className="flex items-center gap-1 mt-3">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                +8.4% trend
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden group bg-white relative">
          <CardContent className="p-6">
            <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
              Monthly Variance
            </p>
            <h3
              className={`text-2xl font-black leading-none uppercase tracking-tighter ${revVariance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              <PrivacyMask
                value={
                  (revVariance >= 0 ? "+" : "") +
                  fmt(revVariance)
                }
              />
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
              Vs. {fmt(expectedMonthlyRev)} target
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === DEPARTMENT BUDGETS === */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Departmental Budgets
              </h2>
            </div>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Department
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Allocated
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Spent
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map((d) => {
                  const pct = (d.spent / d.allocated) * 100;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-900 text-xs">{d.name}</td>
                      <td className="p-4 font-bold text-slate-500 text-xs"><PrivacyMask value={fmt(d.allocated)} /></td>
                      <td className="p-4 font-black text-slate-900 text-xs"><PrivacyMask value={fmt(d.spent)} /></td>
                      <td className="p-4">
                        <span className={`bg-slate-50 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${pct > 90 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {pct.toFixed(0)}% Utilized
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* === COMPLIANCE === */}
        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2 bg-white">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Recent Activity
            </h3>
          </div>
          <CardContent className="p-5 space-y-4">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-[9px] font-bold text-slate-400">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 leading-snug">
                    {log.details?.title || log.details?.name || log.entity_type || 'System Action'} 
                    {log.details?.amount && ` - ${fmt(Number(log.details.amount))}`}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Treasury Alert</p>
                <p className="text-[11px] font-bold text-slate-700">Audit logs are active for all operational releases.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === OPERATIONAL BUDGET REQUESTS === */}
      <Card className="border border-indigo-100 shadow-none rounded-xl overflow-hidden bg-white">
        <div className="p-8 border-b border-indigo-50 bg-indigo-50/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
                Operational Budget Requests
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Centralized HR & Payroll Clearing House
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <Tabs defaultValue="recruitment" className="w-full">
            <TabsList className="bg-slate-50 p-1 rounded-xl mb-8">
              <TabsTrigger value="recruitment" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Recruitment ({pendingRecruitment.length})
              </TabsTrigger>
              <TabsTrigger value="payroll" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Payroll ({pendingPayroll.length})
              </TabsTrigger>
              <TabsTrigger value="training" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Training ({pendingTraining.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recruitment">
              {pendingRecruitment.length === 0 ? (
                <div className="p-12 text-center text-slate-300 font-bold uppercase text-[10px]">No pending recruitment budgets</div>
              ) : (
                <div className="grid gap-4">
                  {pendingRecruitment.map((job) => (
                    <div key={job.id} className="p-5 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all border-slate-100 bg-white">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{job.job_title}</h4>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{job.departments?.name || "Multiple Depts"}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleInitiateApproval('recruitment', job.id, 0, job.job_title)}
                        className="bg-slate-900 text-white font-black text-[9px] uppercase px-6 rounded-lg h-10"
                      >
                        Set Budget & Approve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payroll">
              {pendingPayroll.length === 0 ? (
                <div className="p-12 text-center text-slate-300 font-bold uppercase text-[10px]">No pending payroll batches</div>
              ) : (
                <div className="grid gap-4">
                  {pendingPayroll.map((pay) => (
                    <div key={pay.id} className="p-5 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all border-slate-100 bg-white">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{pay.profiles?.full_name || 'Batch Payout'}</h4>
                          <p className="font-black text-emerald-600 text-sm">{fmt(pay.net_pay || 0)}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleInitiateApproval('payroll', pay.id, pay.net_pay, `Payroll for ${pay.profiles?.full_name}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase px-6 rounded-lg h-10"
                      >
                        Authorize Release
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="training">
              {pendingTraining.length === 0 ? (
                <div className="p-12 text-center text-slate-300 font-bold uppercase text-[10px]">No pending training budgets</div>
              ) : (
                <div className="grid gap-4">
                  {pendingTraining.map((ev) => (
                    <div key={ev.id} className="p-5 border rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all border-slate-100 bg-white">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{ev.event_name}</h4>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">EST. {fmt(ev.estimated_budget || 0)}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleInitiateApproval('training', ev.id, ev.estimated_budget, ev.event_name)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase px-6 rounded-lg h-10"
                      >
                        Approve Funds
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === VARIANCE ANALYSIS === */}
        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Variance Analysis
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="flex items-end gap-3 h-48">
              {monthlyActuals.map((m) => {
                const isMet = m.actualRev >= expectedMonthlyRev;
                const maxBar = Math.max(expectedMonthlyRev * 1.5, ...monthlyActuals.map((x) => x.actualRev));
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="w-full relative flex justify-center items-end" style={{ height: "100%" }}>
                      <div className="absolute bottom-0 w-full bg-slate-100 rounded-t-sm" style={{ height: `${(expectedMonthlyRev / maxBar) * 100}%` }} />
                      <div className={`absolute bottom-0 w-3/4 rounded-t-sm transition-all duration-500 ${isMet ? "bg-emerald-500" : "bg-red-400"}`} style={{ height: `${(m.actualRev / maxBar) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* === FORECASTING === */}
        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Calculator className="h-4 w-4 text-purple-500" />
              Forecasting
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {forecastData.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-black text-slate-900">{f.month}</span>
                  <span className="text-sm font-black text-emerald-600"><PrivacyMask value={fmt(f.projectedRev)} /></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={isRecruitmentModalOpen} onOpenChange={setIsRecruitmentModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 border-none shadow-2xl bg-white overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50">
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Set Salary Structure</DialogTitle>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Role: {activeRequest?.title}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Monthly Compensation (₱)</Label>
              <Input 
                type="number"
                value={recruitmentBudget}
                onChange={(e) => setRecruitmentBudget(e.target.value)}
                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg"
                placeholder="e.g. 85000"
              />
            </div>
            <Button 
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest"
              onClick={async () => {
                if (!recruitmentBudget) return toast.error("Enter a budget");
                setIsRecruitmentModalOpen(false);
                const toastId = toast.loading("Sending security code...");
                const res = await generateAndSendOTP(profile!.id, profile!.email!);
                if (res.success) {
                  toast.success("Security code sent!", { id: toastId });
                  setIsOtpModalOpen(true);
                } else {
                  toast.error(res.error, { id: toastId });
                }
              }}
            >
              Verify & Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-10 border-none shadow-2xl bg-white overflow-hidden text-center">
          <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner mb-6">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div className="space-y-2 mb-8">
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Treasury Control</DialogTitle>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirming action for: {activeRequest?.title}</p>
          </div>
          <Input 
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="h-16 text-center text-2xl font-black tracking-[0.5em] rounded-2xl border-2 border-slate-100 bg-slate-50 mb-6"
            maxLength={6}
          />
          <Button 
            onClick={handleVerifyAndApprove}
            disabled={isSubmitting || otpValue.length < 6}
            className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all"
          >
            {isSubmitting ? "Processing..." : "Authorize Release"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
