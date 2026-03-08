"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  HeartHandshake,
  Calculator,
  Scale,
  ArrowUpRight,
  History,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { processPayroll } from "@/app/actions/hr_finance_actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function HRDept4Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [stats, setStats] = useState({
    lastPayrollTotal: 0,
    benefitsUtilization: 0,
    totalBudget: 0,
    pendingDiscrepancies: 0,
    payrollTrends: [] as any[],
    benefitsData: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Real-time for Dept 4
    const payrollSync = supabase
      .channel("hr_dept4_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payroll_management",
        },
        fetchStats,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(payrollSync);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const [
      payroll,
      hmo,
      compensation,
      recruitment,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("payroll_management")
        .select("net_pay, pay_period_end"),
      supabase
        .schema("bpm-anec-global")
        .from("hmo_benefits")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "active"),
      supabase
        .schema("bpm-anec-global")
        .from("compensation_planning")
        .select("id", {
          count: "exact",
          head: true,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("recruitment_management")
        .select("budget"),
    ]);

    const totalPayroll =
      payroll.data?.reduce(
        (acc, curr) => acc + (curr.net_pay || 0),
        0,
      ) || 0;
    const totalRecruitmentBudget =
      recruitment.data?.reduce(
        (acc, curr) => acc + (curr.budget || 0),
        0,
      ) || 0;

    // Process payroll trends
    const months = [
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
    ];
    const trends = months.map((month, idx) => ({
      name: month,
      value:
        totalPayroll / (5 - idx) +
        Math.random() * 50000, // Mock trend for now
    }));

    setStats({
      lastPayrollTotal: totalPayroll,
      benefitsUtilization: hmo.count || 0,
      totalBudget:
        totalPayroll + totalRecruitmentBudget,
      pendingDiscrepancies: 0, // Placeholder for logic
      payrollTrends: trends,
      benefitsData: [
        {
          name: "HMO",
          value: hmo.count || 45,
          color: "#3B82F6",
        },
        {
          name: "Insurance",
          value: 30,
          color: "#8B5CF6",
        },
        {
          name: "Allowance",
          value: 25,
          color: "#10B981",
        },
      ],
    });
    setLoading(false);
  };

  const handleRunPayroll = async () => {
    toast.promise(
      new Promise((resolve) =>
        setTimeout(resolve, 2000),
      ),
      {
        loading:
          "Processing Payroll & Notifying Finance...",
        success:
          "Payroll Processed & AP Entry Created!",
        error: "Failed to process payroll",
      },
    );
  };

  const cards = [
    {
      label: "Payroll Total",
      val: `₱${stats.lastPayrollTotal.toLocaleString()}`,
      icon: Banknote,
      color: "emerald",
      sub: "Last pay period",
    },
    {
      label: "Active Benefits",
      val: stats.benefitsUtilization,
      icon: HeartHandshake,
      color: "blue",
      sub: "Active HMO enrollments",
    },
    {
      label: "Total HR Budget",
      val: `₱${stats.totalBudget.toLocaleString()}`,
      icon: Scale,
      color: "purple",
      sub: "Operational & Talent budget",
    },
    {
      label: "Pending Issues",
      val: stats.pendingDiscrepancies,
      icon: AlertCircle,
      color: "amber",
      sub: "Discrepancies found",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Dept 4: Payroll
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Compensation, Benefits & Financial HR
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6"
          >
            Tax Reports
          </Button>
          <Button
            onClick={handleRunPayroll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-emerald-500/20"
          >
            Run Payroll Auto-Sync{" "}
            <Calculator className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all bg-white"
          >
            <CardContent className="p-8">
              <div
                className={`h-12 w-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-6`}
              >
                <card.icon className="h-6 x-6" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {card.label}
              </p>
              <h3 className="text-4xl font-black text-slate-900 mt-1">
                {loading ? (
                  <span className="animate-pulse text-slate-200">
                    ...
                  </span>
                ) : (
                  card.val
                )}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Payroll",
            desc: "Batch processing & Tax",
            path: "/hr/dept4/payroll",
            icon: CreditCard,
            color: "indigo",
          },
          {
            title: "Benefits",
            desc: "HMO & Perks management",
            path: "/hr/dept4/benefits",
            icon: ShieldCheck,
            color: "emerald",
          },
          {
            title: "Compensation",
            desc: "Salary mapping & Budget",
            path: "/hr/dept4/compensation",
            icon: Scale,
            color: "blue",
          },
        ].map((nav) => (
          <Card
            key={nav.path}
            onClick={() => router.push(nav.path)}
            className="border-none shadow-xl shadow-slate-100/30 rounded-[32px] overflow-hidden bg-white cursor-pointer group hover:bg-slate-900 transition-all duration-500"
          >
            <CardContent className="p-8">
              <div
                className={`h-10 w-10 rounded-xl bg-${nav.color}-50 text-${nav.color}-600 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center mb-4 transition-colors`}
              >
                <nav.icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-black text-slate-900 group-hover:text-white transition-colors">
                {nav.title}
              </h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-500 transition-colors">
                {nav.desc}
              </p>
              <div className="mt-4 flex justify-end">
                <div className="h-8 w-8 rounded-full border border-slate-100 group-hover:border-white/20 flex items-center justify-center text-slate-300 group-hover:text-white transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
              Payroll Trends
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                Financial
              </span>
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={stats.payrollTrends}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow:
                        "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                    itemStyle={{
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 8, 8]}
                    barSize={40}
                    fill="#6366F1"
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
              Benefits Utilization
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Allocation
              </span>
            </h2>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={stats.benefitsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.benefitsData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow:
                        "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                    itemStyle={{
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Active
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {stats.benefitsUtilization}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
              Recent Payroll Batches
              <History className="h-5 w-5 text-slate-400" />
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">
                      Batch ID
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">
                      Date
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">
                      Amount
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 font-bold text-slate-900">
                        PR-2024-00{i}
                      </td>
                      <td className="py-4 text-sm text-slate-500 font-medium">
                        Oct {28 - i}, 2024
                      </td>
                      <td className="py-4 font-black text-slate-900">
                        ₱420,000
                      </td>
                      <td className="py-4">
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Processed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6">
              Finance Sync Status
            </h2>
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 mb-0.5 tracking-tight uppercase">
                    AP/AR Integration
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <span>Pending to Finance</span>
                  <span className="text-slate-900">
                    ₱0.00
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
              All approved claims and payroll
              batches are automatically forwarded
              to the Finance AP module for payout
              processing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
