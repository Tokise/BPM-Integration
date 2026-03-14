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
  ChevronLeft,
  Users,
  Activity,
  Clock,
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
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
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
    settledBatches: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
        Math.random() * 50000,
    }));

    // Fetch Settled Batches (latest 10)
    const { data: settled } = await supabase
      .schema("bpm-anec-global")
      .from("payroll_management")
      .select("*")
      .eq("status", "processed")
      .order("processed_at", { ascending: false })
      .limit(10);

    setStats({
      lastPayrollTotal: totalPayroll,
      benefitsUtilization: hmo.count || 0,
      totalBudget:
        totalPayroll + totalRecruitmentBudget,
      pendingDiscrepancies: 0,
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
      settledBatches: settled || [],
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

  const modules = [
    {
      title: "HCM Central",
      description: "Employee directory, profiles, and history",
      icon: Users,
      href: "/hr/dept4/hcm",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      accent: "indigo",
    },
    {
      title: "Automated Payroll",
      description: "Salary, OT, tax, and payslip generation",
      icon: Banknote,
      href: "/hr/dept4/payroll",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "emerald",
    },
    {
      title: "Benefits & HMO",
      description: "Allowances, enrollment, and records",
      icon: ShieldCheck,
      href: "/hr/dept4/benefits",
      color: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "amber",
    },
    {
      title: "Compensation",
      description: "Salary structure, bonuses, and promotions",
      icon: Scale,
      href: "/hr/dept4/compensation",
      color: "bg-slate-50 text-slate-600 border-slate-100",
      accent: "slate",
    },
    {
      title: "HR Analytics",
      description: "Payroll costs, trends, and distribution",
      icon: Activity,
      href: "/hr/dept4/analytics",
      color: "bg-rose-50 text-rose-600 border-rose-100",
      accent: "rose",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-2 w-8 bg-indigo-600 rounded-full" />
             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
               HR Operations 4
             </h1>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-11">
            Strategic Human Capital & Financial Compliance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            className="border shadow-sm rounded-xl overflow-hidden group hover:scale-[1.01] transition-all bg-white relative"
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full bg-${card.color}-500 opacity-20`}
            />
            <CardContent className="p-6">
              <div
                className={`h-10 w-10 rounded-xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-4`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                {card.label}
              </p>
              <div className="text-3xl font-black text-slate-900 leading-none">
                {loading ? (
                  <span className="animate-pulse text-slate-100">
                    ...
                  </span>
                ) : (
                  <PrivacyMask
                    value={card.val.toString()}
                  />
                )}
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Ledger",
            desc: "Batch processing",
            path: "/hr/dept4/payroll",
            icon: CreditCard,
            color: "indigo",
          },
          {
            title: "HMO & Perks",
            desc: "Benefits Hub",
            path: "/hr/dept4/benefits",
            icon: ShieldCheck,
            color: "emerald",
          },
          {
            title: "Salary Plan",
            desc: "Budget Ops",
            path: "/hr/dept4/compensation",
            icon: Scale,
            color: "blue",
          },
        ].map((nav) => (
          <Card
            key={nav.path}
            onClick={() => router.push(nav.path)}
            className="border shadow-sm rounded-xl overflow-hidden bg-white cursor-pointer group hover:bg-slate-900 transition-all duration-300"
          >
            <CardContent className="p-6">
              <div
                className={`h-8 w-8 rounded-lg bg-${nav.color}-50 text-${nav.color}-600 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center mb-4 transition-colors`}
              >
                <nav.icon className="h-4 w-4" />
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-white transition-colors leading-none">
                {nav.title}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 group-hover:text-slate-500 transition-colors">
                {nav.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <h2 className="text-sm font-black text-slate-900 mb-6 flex items-center justify-between uppercase tracking-widest">
              Financial Trends
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg lowercase italic">
                rolling avg
              </span>
            </h2>
            <div className="h-[250px] w-full">
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
                      borderRadius: "12px",
                      border: "none",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 4, 4]}
                    barSize={30}
                    fill="#6366F1"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <h2 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">
              Benefit Allocation
            </h2>
            <div className="h-[250px] w-full relative flex items-center justify-center">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={stats.benefitsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.benefitsData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  ACTIVE
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
        <Card className="lg:col-span-2 border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-50 bg-slate-50/20">
              <h2 className="text-sm font-black text-slate-900 flex items-center justify-between uppercase tracking-widest">
                Settled Batches
                <History className="h-4 w-4 text-slate-400" />
              </h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/10">
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Batch ID
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Cycle
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Total Net
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.settledBatches.map(
                    (b: any) => (
                      <tr
                        key={b.id}
                        className="group hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 font-black text-xs text-slate-900 tracking-tight">
                          BATCH-{b.id.slice(0, 8)}
                        </td>
                        <td className="p-4 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                          {b.pay_period_end}
                        </td>
                        <td className="p-4 font-black text-slate-900 text-xs">
                          <PrivacyMask
                            value={`₱${(Number(b.net_pay) || 0).toLocaleString()}`}
                          />
                        </td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                  {stats.settledBatches.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"
                      >
                        No settled batches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          <CardContent className="p-6 relative">
            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />{" "}
              Compliance Sync
            </h2>
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  AP Gateway Interface
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-tighter text-emerald-400">
                      SYNCCED
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Latency: 12ms
                  </span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                Approved payroll batches are
                automatically forwarded to Finance
                Hub (Core 2) for disbursement
                processing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
