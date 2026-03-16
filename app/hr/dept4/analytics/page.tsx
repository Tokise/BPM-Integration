"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Clock,
  Briefcase,
  Globe,
  Banknote,
  Activity,
  BarChart as BarChartIcon,
  PieChart,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  subMonths,
  startOfMonth,
} from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useUser } from "@/context/UserContext";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AnalyticsDashboard() {
  const supabase = createClient();
  const { profile } = useUser();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] =
    useState<any>({
      headcountTrend: [],
      deptDistribution: [],
      payrollTrend: [],
      salaryDist: [],
    });
  const [stats, setStats] = useState({
    totalHeadcount: 0,
    avgTenure: "0 yrs",
    totalPayroll: "₱0",
    avgSalary: "₱0",
    openPositions: 0,
    diversityRate: "0%",
  });

  const userDeptCode = (
    profile?.department as any
  )?.code;
  const isIntegratedHr = [
    "HR_DEPT1",
    "HR_DEPT2",
    "HR_DEPT3",
  ].includes(userDeptCode);
  const baseUrl =
    userDeptCode === "HR_DEPT1"
      ? "/hr/dept1"
      : userDeptCode === "HR_DEPT2"
        ? "/hr/dept2"
        : userDeptCode === "HR_DEPT3"
          ? "/hr/dept3"
          : "/hr/dept4";

  useEffect(() => {
    if (!isIntegratedHr) {
      fetchAnalytics();
    }
  }, [profile?.id]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Employees
      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select(
          `
          id, 
          created_at, 
          department_id, 
          departments (
            name
          )
        `,
        )
        .not(
          "role",
          "in",
          '("customer","seller")',
        )
        .is("is_archived", false);

      if (profileError) throw profileError;

      // 2. Fetch Payroll for Financial Metrics
      const {
        data: payroll,
        error: payrollError,
      } = await supabase
        .schema("bpm-anec-global")
        .from("payroll_management")
        .select(
          "net_pay, deductions, pay_period_end, status, employee_id",
        );

      if (payrollError) throw payrollError;

      if (profiles) {
        // Stats Calculation
        const totalPayrollVal =
          payroll?.reduce(
            (acc, curr) =>
              acc + Number(curr.net_pay || 0),
            0,
          ) || 0;
        const avgSalaryVal =
          profiles.length > 0
            ? totalPayrollVal / profiles.length
            : 0;

        setStats({
          totalHeadcount: profiles.length,
          avgTenure: "1.2 yrs", // Would require hire_date in profiles
          totalPayroll: `₱${(totalPayrollVal / 1000000).toFixed(2)}M`,
          avgSalary: `₱${(avgSalaryVal / 1000).toFixed(1)}K`,
          openPositions: 8, // Mocked or fetch from recruitment
          diversityRate: "45%",
        });

        // 6-Month Headcount Trend
        const months = Array.from({
          length: 6,
        }).map((_, i) => {
          const d = subMonths(new Date(), 5 - i);
          return {
            date: startOfMonth(d),
            name: format(d, "MMM"),
          };
        });

        const headcountTrend = months.map((m) => {
          const count = profiles.filter(
            (p) =>
              new Date(p.created_at) <= m.date,
          ).length;
          return {
            name: m.name,
            headcount: count,
          };
        });

        // Department Distribution
        const deptMap: Record<string, number> =
          {};
        profiles.forEach((p) => {
          const deptName =
            (p.departments as any)?.name ||
            "Unassigned";
          deptMap[deptName] =
            (deptMap[deptName] || 0) + 1;
        });
        const deptDistribution = Object.entries(
          deptMap,
        ).map(([name, value]) => ({
          name,
          value,
        }));

        // Payroll Trend (Last 6 Months)
        const payrollTrend = months.map((m) => {
          const monthEnd = new Date(
            m.date.getFullYear(),
            m.date.getMonth() + 1,
            0,
          );
          const monthTotal =
            payroll
              ?.filter(
                (p) =>
                  new Date(p.pay_period_end) <=
                    monthEnd &&
                  new Date(p.pay_period_end) >=
                    m.date,
              )
              .reduce(
                (acc, curr) =>
                  acc + Number(curr.net_pay || 0),
                0,
              ) || 0;
          return {
            month: m.name,
            cost: Number(
              (monthTotal / 1000000).toFixed(2),
            ),
          };
        });

               // Salary Distribution by Dept
        const deptSalaryMap: Record<
          string,
          { total: number; count: number }
        > = {};
        profiles.forEach((p) => {
          const deptName =
            (p.departments as any)?.name ||
            "Unassigned";
          if (!deptSalaryMap[deptName])
            deptSalaryMap[deptName] = {
              total: 0,
              count: 0,
            };
          
          // Match profile with payroll entries
          // Assuming payroll entries are for a specific period and we want the latest net_pay for an employee
          const empPayrolls = payroll?.filter(pay => pay.employee_id === p.id);
          // Sort by pay_period_end to get the latest, or just take the first if order isn't guaranteed
          const latestPay = empPayrolls && empPayrolls.length > 0 ? Number(empPayrolls.sort((a,b) => new Date(b.pay_period_end).getTime() - new Date(a.pay_period_end).getTime())[0].net_pay) : 0;
          
          deptSalaryMap[deptName].total += latestPay;
          deptSalaryMap[deptName].count += 1;
        });

        const salaryDist = Object.entries(deptSalaryMap).map(([name, data]) => ({
            dept: name,
            avg: data.count > 0 ? Math.round(data.total / data.count) : 0
        }));

        setAnalyticsData({
          headcountTrend,
          deptDistribution,
          payrollTrend,
          salaryDist,
        });
      }
    } catch (error) {
      console.error(
        "Analytics fetch error:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  if (isIntegratedHr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
          <Globe className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
          Access Restricted
        </h2>
        <p className="text-[10px] font-bold text-slate-400 max-w-sm uppercase tracking-[0.2em] leading-relaxed">
          Strategic analytics are currently
          restricted to HR Department 4
          administrators.
        </p>
        <Link href={baseUrl}>
          <Button
            variant="outline"
            className="mt-4 rounded-lg font-black uppercase text-[10px] tracking-widest border-slate-200"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/hr/dept4">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              HR Analytics
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            Intelligence
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
            Real-time workforce & financial
            metrics
          </p>
        </div>

        <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-11 px-8 shadow-sm uppercase tracking-widest text-[10px]">
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "Active Headcount",
            value: stats.totalHeadcount,
            color:
              "text-indigo-600 bg-indigo-50 border-indigo-100",
          },
          {
            icon: Clock,
            label: "Avg. Tenure",
            value: stats.avgTenure,
            color:
              "text-amber-600 bg-amber-50 border-amber-100",
          },
          {
            icon: Briefcase,
            label: "Open Roles",
            value: stats.openPositions,
            color:
              "text-blue-600 bg-blue-50 border-blue-100",
          },
          {
            icon: Globe,
            label: "Diversity Index",
            value: stats.diversityRate,
            color:
              "text-emerald-600 bg-emerald-50 border-emerald-100",
          },
        ].map((item, i) => (
          <Card
            key={i}
            className="border border-slate-100 shadow-sm rounded-lg p-6 bg-white transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center border",
                  item.color,
                )}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                  {item.label}
                </p>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {loading ? "..." : item.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Headcount Velocity
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={
                  analyticsData.headcountTrend
                }
              >
                <defs>
                  <linearGradient
                    id="colorHeadcount"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#6366f1"
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f8fafc"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fontWeight: 800,
                    fill: "#94a3b8",
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fontWeight: 800,
                    fill: "#94a3b8",
                  }}
                />
                <ReTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #f1f5f9",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="headcount"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorHeadcount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white p-8">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-500" />
            Department Split
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <RePieChart>
                <Pie
                  data={
                    analyticsData.deptDistribution
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {analyticsData.deptDistribution.map(
                    (
                      entry: any,
                      index: number,
                    ) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index % COLORS.length
                          ]
                        }
                      />
                    ),
                  )}
                </Pie>
                <ReTooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    fontSize: "9px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "#64748b",
                    paddingTop: "20px",
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Gross Expenditure
              </p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.totalPayroll}
              </h2>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[70%]" />
          </div>
          <p className="text-[9px] font-bold mt-3 text-emerald-600 uppercase tracking-tight">
            +8.2% vs Previous Period
          </p>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Compensation Avg.
              </p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.avgSalary}
              </h2>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[45%]" />
          </div>
          <p className="text-[9px] font-bold mt-3 text-slate-400 uppercase tracking-tight">
            Market Benchmarked: Optimal
          </p>
        </Card>

        <Card className="border-none bg-indigo-600 text-white p-6 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-2 italic">
              Forecast
            </h3>
            <p className="text-xs font-medium opacity-80 leading-relaxed">
              Workforce is projected to scale by
              12% in the coming fiscal quarter
              based on current requisition
              velocity.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-6 h-9 rounded-md border-white/20 hover:bg-white/10 text-white font-black uppercase text-[9px] tracking-widest bg-transparent"
          >
            Strategy Dashboard
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Banknote className="h-4 w-4 text-indigo-600" />{" "}
              Disbursement Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={
                    analyticsData.payrollTrend
                  }
                >
                  <defs>
                    <linearGradient
                      id="colorCost"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#4f46e5"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="#4f46e5"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f8fafc"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  />
                  <ReTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #f1f5f9",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontWeight: "bold",
                      fontSize: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-lg bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />{" "}
              Dept Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={analyticsData.salaryDist}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f8fafc"
                  />
                  <XAxis
                    dataKey="dept"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  />
                  <ReTooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #f1f5f9",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontWeight: "bold",
                      fontSize: "10px",
                    }}
                  />
                  <Bar
                    dataKey="avg"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
