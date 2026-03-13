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
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShieldAlert,
  Calculator,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Search,
  Filter,
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

export default function BudgetManagementPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

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
      fetchData();
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
              <Target className="h-5 w-5" />
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
        {/* === DEPARTMENT BUDGETS (DEVELOP & COORDINATE) === */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Departmental Budgets
              </h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest border-slate-200"
            >
              Adjust Caps
            </Button>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Department
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Allocated Budget
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Actual Spent
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">
                    Utilization
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map((d) => {
                  const pct =
                    (d.spent / d.allocated) * 100;
                  const isOver = pct > 90;
                  const isWarn =
                    pct > 75 && pct <= 90;
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-black text-slate-900 text-xs">
                        {d.name}
                      </td>
                      <td className="p-4 font-bold text-slate-500 text-xs">
                        <PrivacyMask
                          value={fmt(d.allocated)}
                        />
                      </td>
                      <td className="p-4 font-black text-slate-900 text-xs">
                        <PrivacyMask
                          value={fmt(d.spent)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-600 w-8">
                            {pct.toFixed(0)}%
                          </span>
                          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOver ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-2.5 w-2.5" />{" "}
                            Over Budget
                          </span>
                        ) : isWarn ? (
                          <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            Nearing Limit
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/50">
                <tr>
                  <td className="p-4 font-black text-slate-900 text-xs uppercase text-[10px] tracking-widest">
                    Total
                  </td>
                  <td className="p-4 font-black text-slate-900 text-xs">
                    {fmt(totalAllocated)}
                  </td>
                  <td className="p-4 font-black text-slate-900 text-xs">
                    {fmt(totalSpent)}
                  </td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* === COMPLIANCE & FINANCIAL GUIDANCE === */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <div className="p-5 border-b border-slate-200 flex items-center gap-2 bg-white">
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Compliance Alerts
              </h3>
            </div>
            <CardContent className="p-5 space-y-3">
              {departments.some(
                (d) =>
                  d.spent / d.allocated > 0.9,
              ) ? (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-black text-red-700 uppercase tracking-widest mb-1">
                      Budget Overrun Detected
                    </p>
                    <p className="text-[10px] font-bold text-red-600/80 leading-relaxed">
                      Logistics department has
                      exceeded 90% of its
                      allocated budget. Recommend
                      initiating a cost-control
                      review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-3 items-start">
                  <ShieldAlert className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1">
                      All Departments Compliant
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600/80 leading-relaxed">
                      No departments are currently
                      exceeding their allocated
                      thresholds.
                    </p>
                  </div>
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
                <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-1">
                    Guidance Recommendation
                  </p>
                  <p className="text-[10px] font-bold text-blue-600/80 leading-relaxed">
                    With current revenue variance
                    at{" "}
                    {revVariance >= 0
                      ? "positive"
                      : "negative"}
                    , consider adjusting the
                    marketing allocation for Q3 to
                    drive additional volume.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === VARIANCE ANALYSIS (BUDGET VS ACTUALS) === */}
        <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Variance Analysis
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-widest mb-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded bg-slate-200" />
                <span className="text-slate-500">
                  Target
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded bg-emerald-500" />
                <span className="text-slate-500">
                  Actual Revenue
                </span>
              </div>
            </div>

            <div className="flex items-end gap-3 h-48">
              {monthlyActuals.map((m) => {
                const isMet =
                  m.actualRev >=
                  expectedMonthlyRev;
                const maxBar = Math.max(
                  expectedMonthlyRev * 1.5,
                  ...monthlyActuals.map(
                    (x) => x.actualRev,
                  ),
                );
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-2 group relative"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded w-max z-10 pointer-events-none">
                      {fmt(m.actualRev)} (
                      {isMet ? "+" : "-"}
                      {fmt(
                        Math.abs(
                          m.actualRev -
                            expectedMonthlyRev,
                        ),
                      )}
                      )
                    </div>

                    <div
                      className="w-full relative flex justify-center items-end"
                      style={{ height: "100%" }}
                    >
                      {/* Target Line/Bar (background ghost) */}
                      <div
                        className="absolute bottom-0 w-full bg-slate-100 rounded-t-sm"
                        style={{
                          height: `${(expectedMonthlyRev / maxBar) * 100}%`,
                        }}
                      />
                      {/* Actual Bar */}
                      <div
                        className={`absolute bottom-0 w-3/4 rounded-t-sm transition-all duration-500 ${isMet ? "bg-emerald-500" : "bg-red-400"}`}
                        style={{
                          height: `${(m.actualRev / maxBar) * 100}%`,
                          minHeight:
                            m.actualRev > 0
                              ? "4px"
                              : "0",
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* === FINANCIAL FORECASTING === */}
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Calculator className="h-4 w-4 text-purple-500" />
              Forecasting
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-black text-slate-700">
                  Expected MoM Growth (%)
                </label>
                <span className="text-lg font-black text-blue-600">
                  {growthAssumption}%
                </span>
              </div>
              <Input
                type="range"
                min="-10"
                max="30"
                value={growthAssumption}
                onChange={(e) =>
                  setGrowthAssumption(
                    Number(e.target.value),
                  )
                }
                className="w-full h-2 p-0 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400 uppercase">
                <span>-10% (Pessimistic)</span>
                <span>+30% (Optimistic)</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Projected Revenue (Next 3 Months)
              </h4>
              {forecastData.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <span className="text-xs font-black text-blue-600">
                        M{i + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {f.month}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400">
                        Based on{" "}
                        {growthAssumption}% growth
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">
                      <PrivacyMask
                        value={fmt(
                          f.projectedRev,
                        )}
                      />
                    </p>
                    <p className="text-[10px] font-black text-blue-500">
                      +
                      <PrivacyMask
                        value={fmt(
                          f.projectedRev -
                            expectedMonthlyRev,
                        )}
                      />{" "}
                      vs Target
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
