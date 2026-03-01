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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

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

  // Departmental Budgets
  const [departments, setDepartments] = useState([
    {
      id: "logistics",
      name: "Logistics & Fleet",
      allocated: 120000,
      spent: 45000,
    },
    {
      id: "marketing",
      name: "Marketing & Growth",
      allocated: 80000,
      spent: 32000,
    },
    {
      id: "hr",
      name: "HR & Payroll",
      allocated: 60000,
      spent: 15000,
    },
    {
      id: "operations",
      name: "Core Operations",
      allocated: 40000,
      spent: 28000,
    },
  ]);

  // Forecasting Sliders
  const [growthAssumption, setGrowthAssumption] =
    useState(5); // 5% MoM growth assumption

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch payouts to calculate actual platform revenue (commission + fees + tax)
      const { data: payouts } = await supabase
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
    fetchData();
  }, [supabase]);

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">
          Budget Management &amp; Planning
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Coordinate budgets, monitor variance,
          and forecast financial performance.
        </p>
      </div>

      {/* === TOP KPI ROW === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl p-5 bg-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 h-16 w-16 bg-blue-50 rounded-full blur-2xl opacity-40" />
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">
              Targeted
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Annual Revenue Target
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-black text-slate-900">
              {fmt(annualRevenueTarget)}
            </p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-500">
              <span>
                YTD Actual:{" "}
                {fmt(actualYtdRevenue)}
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
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min((actualYtdRevenue / annualRevenueTarget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl p-5 bg-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 h-16 w-16 bg-purple-50 rounded-full blur-2xl opacity-40" />
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">
              Approved
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Total Operating Budget
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-black text-slate-900">
              {fmt(annualExpenseBudget)}
            </p>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-500">
              <span>
                Total Spent: {fmt(totalSpent)}
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
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{
                  width: `${Math.min((totalSpent / annualExpenseBudget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl p-5 bg-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 h-16 w-16 bg-emerald-50 rounded-full blur-2xl opacity-40" />
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Remaining Budget
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-black text-emerald-600">
              {fmt(remainingBudget)}
            </p>
          </div>
          <p className="text-[9px] font-bold text-slate-400 mt-2">
            Available for departmental allocation
          </p>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl p-5 bg-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 h-16 w-16 bg-amber-50 rounded-full blur-2xl opacity-40" />
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Current Mo. Variance
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p
              className={`text-2xl font-black ${revVariance >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {revVariance >= 0 ? "+" : ""}
              {fmt(revVariance)}
            </p>
          </div>
          <p className="text-[9px] font-bold text-slate-400 mt-2">
            Vs. expected monthly target (
            {fmt(expectedMonthlyRev)})
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === DEPARTMENT BUDGETS (DEVELOP & COORDINATE) === */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-black tracking-tight flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Departmental Budget Allocations
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] font-black rounded-lg"
              >
                Adjust Budgets
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Monitor departmental spending and
              provide guidance on cost control.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
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
                        {fmt(d.allocated)}
                      </td>
                      <td className="p-4 font-black text-slate-900 text-xs">
                        {fmt(d.spent)}
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
          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-5 border-b border-slate-50">
              <CardTitle className="text-sm font-black tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                Financial Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {departments.some(
                (d) =>
                  d.spent / d.allocated > 0.9,
              ) ? (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start">
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
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3 items-start">
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
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
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
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-sm font-black tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              Variance Analysis (Monthly Actual vs
              Target)
            </CardTitle>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Track platform income against the
              monthly budget target of{" "}
              {fmt(expectedMonthlyRev)}
            </p>
          </CardHeader>
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
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-black tracking-tight flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-slate-400" />
                  Short & Long-Term Forecasting
                </CardTitle>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  Simulate future revenue based on
                  growth assumptions.
                </p>
              </div>
            </div>
          </CardHeader>
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
                      {fmt(f.projectedRev)}
                    </p>
                    <p className="text-[10px] font-black text-blue-500">
                      +
                      {fmt(
                        f.projectedRev -
                          expectedMonthlyRev,
                      )}{" "}
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
