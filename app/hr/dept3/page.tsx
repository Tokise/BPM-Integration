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
  ShieldCheck,
  Fingerprint,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { PrivacyMask } from "@/components/ui/privacy-mask";
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
    pendingLeaves: [] as any[],
    liveTerminal: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
        .select("id, check_in, employee_id")
        .gte("check_in", `${today}T00:00:00Z`),
      supabase
        .schema("bpm-anec-global")
        .from("leave_management")
        .select("status, type"),
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
        .not("role", "in", '("customer","seller")'),
    ]);

    // Count unique employees present today
    const uniqueEmployeesToday = new Set(attendanceToday.data?.map(a => a.employee_id)).size;
    const activeCount = uniqueEmployeesToday;
    const totalCount = (totalStaff.count || 0) > 0 ? totalStaff.count || 0 : 1;
    const attRate = Math.round(
      (activeCount / totalCount) * 100,
    );

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
          (l) => l.type === type,
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

    // Fetch Pending Leaves with Profiles
    const { data: pendingLeavesData } =
      await supabase
        .schema("bpm-anec-global")
        .from("leave_management")
        .select(
          "*, profiles!leave_management_employee_id_fkey(full_name)",
        )
        .eq("status", "pending")
        .limit(5);

    // Fetch Live Terminal (latest 10 logs)
    const { data: liveAttendance } =
      await supabase
        .schema("bpm-anec-global")
        .from("attendance")
        .select(
          "*, profiles!attendance_employee_id_fkey(full_name)",
        )
        .order("check_in", { ascending: false })
        .limit(10);

    // Generate Chart Data from real attendance (unique check-ins per hour)
    const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
    const chartData = hours.map(h => {
      const hInt = parseInt(h.split(':')[0]);
      // Count unique employees who checked in during this hour
      const uniqueAtHour = new Set(
        attendanceToday.data
          ?.filter(a => {
            const checkInDate = new Date(a.check_in);
            return checkInDate.getHours() === hInt;
          })
          .map(a => a.employee_id)
      ).size;
      return {
        name: h,
        value: uniqueAtHour
      };
    });

    setStats({
      activeEmployeesToday: activeCount,
      pendingLeave:
        leaveRequests.data?.filter(
          (l) => l.status === "pending",
        ).length || 0,
      pendingClaims: claimsPending.count || 0,
      attendanceRate: attRate,
      attendanceData: chartData,
      leaveData: leaveData,
      pendingLeaves: pendingLeavesData || [],
      liveTerminal: liveAttendance || [],
    });
    setLoading(false);
  };

  const handleLeaveAction = async (
    id: string,
    action: "approved" | "rejected",
  ) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("leave_management")
      .update({ status: action })
      .eq("id", id);

    if (error) {
      toast.error(`Failed to ${action} leave`);
    } else {
      toast.success(`Leave request ${action}`);
      fetchStats();
    }
  };

  const handleBatchSettlement = async () => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        const { error } = await supabase
          .schema("bpm-anec-global")
          .from("attendance")
          .update({ status: "Settled" })
          .is("check_out", null);

        if (error) reject(error);
        else resolve(true);
      }),
      {
        loading:
          "Settling all active sessions...",
        success: "All active logs settled",
        error: "Batch settlement failed",
      },
    );
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
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            Time & Attendance
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Workforce Operations • Admin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] overflow-hidden group hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 bg-white relative"
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div
                  className={`h-12 w-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}
                >
                  <card.icon className="h-6 w-6" />
                </div>
                <div className={`h-1.5 w-1.5 rounded-full bg-${card.color}-500 group-hover:animate-ping`} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-2">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                    {loading ? (
                      <span className="animate-pulse text-slate-100">...</span>
                    ) : (
                      <PrivacyMask value={card.val.toString()} />
                    )}
                  </h3>
                  {card.label === "Attendance Rate" && (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tight flex items-center gap-1.5">
                  <span className={`h-1 w-1 rounded-full bg-${card.color}-400`} />
                  {card.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Timekeeping",
            desc: "Attendance Hub",
            path: "/hr/dept3/attendance",
            icon: Clock,
            color: "blue",
          },
          {
            title: "Leaves",
            desc: "Absence Control",
            path: "/hr/dept3/leave",
            icon: CalendarDays,
            color: "emerald",
          },
          {
            title: "Scheduling",
            desc: "Operational Rota",
            path: "/hr/dept3/shifts",
            icon: LayoutGrid,
            color: "amber",
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
              Attendance Flow
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                RFID Stream
              </span>
            </h2>
            <div className="h-[250px] w-full">
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
                    fill="#10B981"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <h2 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">
              Leave Distribution
            </h2>
            <div className="h-[250px] w-full relative flex items-center justify-center">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={stats.leaveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.leaveData.map(
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
                  OUT
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {stats.leaveData.reduce(
                    (a, c) => a + c.value,
                    0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-50">
              <h2 className="text-sm font-black text-slate-900 flex items-center justify-between uppercase tracking-widest">
                Pending Absences
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Action Required
                </span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {stats.pendingLeaves.map(
                (l: any) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                        {l.type?.charAt(
                          0,
                        ) || "L"}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          <PrivacyMask
                            value={
                              l.profiles
                                ?.full_name ||
                              "Unknown"
                            }
                          />
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                          {l.type} •{" "}
                          {l.start_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handleLeaveAction(
                            l.id,
                            "rejected",
                          )
                        }
                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() =>
                          handleLeaveAction(
                            l.id,
                            "approved",
                          )
                        }
                        className="h-8 w-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ),
              )}
              {stats.pendingLeaves.length ===
                0 && (
                <div className="text-center py-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    No pending requests
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <h2 className="text-sm font-black text-slate-900 mb-6 flex items-center justify-between uppercase tracking-widest">
              Live Terminal
              <ScanLine className="h-4 w-4 text-emerald-500" />
            </h2>
            <div className="space-y-4">
              {stats.liveTerminal.map(
                (log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${log.check_out ? "bg-slate-300" : "bg-emerald-500 animate-pulse"} shrink-0`}
                      />
                      <div>
                        <div className="text-sm font-black text-slate-900">
                          <PrivacyMask
                            value={
                              log.profiles
                                ?.full_name ||
                              "Employee"
                            }
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                          {log.check_out
                            ? "Verified Session"
                            : `Online Now (${Math.floor((new Date().getTime() - new Date(log.check_in).getTime()) / (1000 * 60 * 60))}h ${Math.floor(((new Date().getTime() - new Date(log.check_in).getTime()) / (1000 * 60)) % 60)}m)`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900 uppercase">
                        {new Date(
                          log.check_in,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      <p
                        className={`text-[9px] font-black uppercase tracking-tight ${log.check_out ? "text-slate-400" : "text-emerald-600"}`}
                      >
                        {log.check_out
                          ? "OUT"
                          : "IN"}
                      </p>
                    </div>
                  </div>
                ),
              )}
              {stats.liveTerminal.length ===
                0 && (
                <div className="text-center py-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    No terminal activity
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full h-10 border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all mt-2"
              >
                Access Full Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
