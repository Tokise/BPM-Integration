"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CalendarDays,
  WalletCards,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  LayoutGrid,
  Zap,
  Briefcase,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
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

export default function HRDept3Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeEmployeesToday: 0,
    pendingLeave: 0,
    pendingClaims: 0,
    attendanceRate: 0,
    attendanceData: [] as any[],
    leaveData: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Real-time for Dept 3
    const attendanceSync = supabase
      .channel("hr_dept3_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "attendance",
        },
        fetchStats,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "leave_management",
        },
        fetchStats,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceSync);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const [
      attendanceToday,
      leaveRequests,
      claimsPending,
      totalStaff,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("attendance")
        .select("id, check_in")
        .gte("check_in", `${today}T00:00:00`),
      supabase
        .schema("bpm-anec-global")
        .from("leave_management")
        .select("status, leave_type"),
      supabase
        .schema("bpm-anec-global")
        .from("claims_reimbursement")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending"),
      supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("role", [
          "hr",
          "admin",
          "logistics",
          "finance",
        ]),
    ]);

    const activeCount =
      attendanceToday.data?.length || 0;
    const totalCount = totalStaff.count || 1;
    const attRate = Math.round(
      (activeCount / totalCount) * 100,
    );

    // Process leave data for charts
    const leaveTypes = [
      "Sick",
      "Vacation",
      "Emergency",
      "Maternity",
    ];
    const leaveData = leaveTypes.map((type) => ({
      name: type,
      value:
        leaveRequests.data?.filter(
          (l) => l.leave_type === type,
        ).length || 0,
      color:
        type === "Sick"
          ? "#EF4444"
          : type === "Vacation"
            ? "#3B82F6"
            : type === "Emergency"
              ? "#F59E0B"
              : "#10B981",
    }));

    setStats({
      activeEmployeesToday: activeCount,
      pendingLeave:
        leaveRequests.data?.filter(
          (l) => l.status === "pending",
        ).length || 0,
      pendingClaims: claimsPending.count || 0,
      attendanceRate: attRate,
      attendanceData: [
        { name: "08:00", value: 12 },
        { name: "09:00", value: 34 },
        { name: "10:00", value: 45 },
        { name: "11:00", value: 48 },
      ],
      leaveData: leaveData,
    });
    setLoading(false);
  };
  const cards = [
    {
      label: "Attendance Rate",
      val: `${stats.attendanceRate}%`,
      icon: Clock,
      color: "blue",
      sub: "Currently timed in",
    },
    {
      label: "Pending Leave",
      val: stats.pendingLeave,
      icon: CalendarDays,
      color: "indigo",
      sub: "Requests awaiting review",
    },
    {
      label: "Pending Claims",
      val: stats.pendingClaims,
      icon: WalletCards,
      color: "emerald",
      sub: "Expense reimbursements",
    },
    {
      label: "Active Staff",
      val: stats.activeEmployeesToday,
      icon: Users,
      color: "amber",
      sub: "In office / Online today",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Dept 3: Workforce
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Time, Attendance & Reimbursement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6"
          >
            View Schedule
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-emerald-500/20">
            Approve Claims
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
                <card.icon className="h-6 w-6" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Attendance",
            desc: "Clock-in/out & Logs",
            path: "/hr/dept3/attendance",
            icon: Clock,
            color: "blue",
          },
          {
            title: "Leave",
            desc: "Requests & Approvals",
            path: "/hr/dept3/leave",
            icon: CalendarDays,
            color: "emerald",
          },
          {
            title: "Shifts",
            desc: "Scheduling & Rosters",
            path: "/hr/dept3/shifts",
            icon: LayoutGrid,
            color: "amber",
          },
          {
            title: "Claims",
            desc: "Expense Reimbursement",
            path: "/hr/dept3/claims",
            icon: WalletCards,
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
              Attendance Trend
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Real-time
              </span>
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={stats.attendanceData}
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
                    fill="#10B981"
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
              Leave Distribution
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
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
                    data={stats.leaveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.leaveData.map(
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
                  {stats.leaveData.reduce(
                    (acc, curr) =>
                      acc + curr.value,
                    0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-xl font-black text-slate-900 flex items-center justify-between">
                Pending Leave Requests
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  High Priority
                </span>
              </h2>
            </div>
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-3xl border border-slate-50 hover:bg-slate-50/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                      BW
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Bruce Wayne
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Sick Leave • 2 Days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 w-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
              Attendance Today
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </h2>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-bold text-slate-900">
                      Clark Kent
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900">
                        08:02 AM
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                        Time In
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                className="w-full rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50"
              >
                View All Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
