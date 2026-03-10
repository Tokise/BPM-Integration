"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Users,
  ShoppingBag,
  Store,
  History,
  Banknote,
  BarChart3,
  ShieldCheck,
  Shield,
  Activity,
  TrendingUp,
  Eye,
  User,
  Building2,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { getUserGrowthStats } from "@/app/actions/users";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] =
    useState(0);
  const [grossSales, setGrossSales] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSellers, setTotalSellers] =
    useState(0);
  const [pendingPayouts, setPendingPayouts] =
    useState(0);
  const [recentLogs, setRecentLogs] = useState<
    any[]
  >([]);
  const [payoutSellers, setPayoutSellers] =
    useState<
      {
        name: string;
        orders: number;
        amount: number;
      }[]
    >([]);
  const [monthlyOrders, setMonthlyOrders] =
    useState<{ month: string; count: number }[]>(
      [],
    );
  const [userGrowth, setUserGrowth] = useState<
    { month: string; count: number }[]
  >([]);
  const [selectedLogUser, setSelectedLogUser] =
    useState<{
      name: string;
      logs: any[];
    } | null>(null);
  const [pipelinePending, setPipelinePending] =
    useState(0);
  const [pipelineApproved, setPipelineApproved] =
    useState(0);
  const [
    pipelineCompleted,
    setPipelineCompleted,
  ] = useState(0);
  const [
    totalPayoutAmount,
    setTotalPayoutAmount,
  ] = useState(0);
  const [platformRevenue, setPlatformRevenue] =
    useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();

    // === ORDERS (from orders table directly) ===
    const { data: allOrders } = await supabase
      .from("orders")
      .select(
        "id, status, total_amount, created_at",
      );

    const orders = allOrders || [];
    setTotalOrders(orders.length);
    setGrossSales(
      orders
        .filter((o) => o.status !== "cancelled")
        .reduce(
          (a, o) =>
            a + Number(o.total_amount || 0),
          0,
        ),
    );

    // Monthly orders
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      );
      months[
        d.toLocaleDateString(undefined, {
          month: "short",
        })
      ] = 0;
    }
    orders.forEach((o) => {
      const key = new Date(
        o.created_at,
      ).toLocaleDateString(undefined, {
        month: "short",
      });
      if (months[key] !== undefined)
        months[key]++;
    });
    setMonthlyOrders(
      Object.entries(months).map(
        ([month, count]) => ({ month, count }),
      ),
    );

    // === Users ===
    const { count: uCount } = await supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      });
    setTotalUsers(uCount || 0);

    // Fetch growth from actual auth users via server action
    const growthStats =
      await getUserGrowthStats();
    setUserGrowth(growthStats);

    // === Sellers ===
    const { count: sCount } = await supabase
      .from("shops")
      .select("id", {
        count: "exact",
        head: true,
      });
    setTotalSellers(sCount || 0);

    // === Payouts ===
    const { data: allPayouts } = await supabase
      .from("payout_management")
      .select(
        "amount, commission_fee, payment_processing_fee, withholding_tax, status, shops:shop_id(name)",
      );

    const payouts = allPayouts || [];
    const pending = payouts.filter(
      (p) => p.status === "pending",
    );
    const approved = payouts.filter(
      (p) => p.status === "approved",
    );
    const completed = payouts.filter(
      (p) => p.status === "completed",
    );

    setPipelinePending(pending.length);
    setPipelineApproved(approved.length);
    setPipelineCompleted(completed.length);
    setPendingPayouts(pending.length);
    setTotalPayoutAmount(
      payouts.reduce(
        (a, p) => a + Number(p.amount),
        0,
      ),
    );
    setPlatformRevenue(
      completed.reduce(
        (a, p) =>
          a +
          Number(p.commission_fee || 0) +
          Number(p.payment_processing_fee || 0) +
          Number(p.withholding_tax || 0),
        0,
      ),
    );

    const sellerMap: Record<
      string,
      {
        name: string;
        orders: number;
        amount: number;
      }
    > = {};
    pending.forEach((p: any) => {
      const name = p.shops?.name || "Unknown";
      if (!sellerMap[name])
        sellerMap[name] = {
          name,
          orders: 0,
          amount: 0,
        };
      sellerMap[name].orders++;
      sellerMap[name].amount += Number(p.amount);
    });
    setPayoutSellers(Object.values(sellerMap));

    // === Audit logs ===
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("*, profiles:user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(20);
    setRecentLogs(logs || []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ch = supabase
      .channel("admin-dash-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "orders",
        },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payout_management",
        },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "profiles",
        },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "audit_logs",
        },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, fetchData]);

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const maxMonth = Math.max(
    ...monthlyOrders.map((m) => m.count),
    1,
  );
  const maxUser = Math.max(
    ...userGrowth.map((m) => m.count),
    1,
  );

  const actionColors: Record<string, string> = {
    payout_approved: "bg-blue-50 text-blue-600",
    payout_disbursed:
      "bg-emerald-50 text-emerald-600",
    policy_created:
      "bg-purple-50 text-purple-600",
    category_created:
      "bg-amber-50 text-amber-600",
    category_deleted: "bg-red-50 text-red-600",
    subscription_plan_created:
      "bg-indigo-50 text-indigo-600",
  };

  const totalPipeline =
    pipelinePending +
    pipelineApproved +
    pipelineCompleted;
  const completionRate =
    totalPipeline > 0
      ? (pipelineCompleted / totalPipeline) * 100
      : 0;
  const approvalRate =
    totalPipeline > 0
      ? ((pipelineApproved + pipelineCompleted) /
          totalPipeline) *
        100
      : 0;
  const userToSellerRatio =
    totalUsers > 0
      ? (totalSellers / totalUsers) * 100
      : 0;
  const healthScore = useMemo(() => {
    const scores = [
      completionRate * 0.4,
      approvalRate * 0.3,
      Math.min(totalUsers > 0 ? 100 : 0, 100) *
        0.15,
      Math.min(totalSellers > 0 ? 100 : 0, 100) *
        0.15,
    ];
    return Math.round(
      scores.reduce((a, s) => a + s, 0),
    );
  }, [
    completionRate,
    approvalRate,
    totalUsers,
    totalSellers,
  ]);

  // Group logs by user
  const userLogGroups = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        count: number;
        lastAction: string;
        lastDate: string;
        logs: any[];
      }
    > = {};
    recentLogs.forEach((log) => {
      const uid = log.user_id;
      if (!map[uid])
        map[uid] = {
          name:
            log.profiles?.full_name || "System",
          count: 0,
          lastAction: log.action,
          lastDate: log.created_at,
          logs: [],
        };
      map[uid].count++;
      map[uid].logs.push(log);
    });
    return Object.values(map).sort(
      (a, b) =>
        new Date(b.lastDate).getTime() -
        new Date(a.lastDate).getTime(),
    );
  }, [recentLogs]);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">
          Admin Dashboard
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Platform overview — real-time
        </p>
      </div>

      {/* === GOVERNANCE QUICK ACTIONS === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() =>
            router.push(
              "/core/transaction3/admin/hcm",
            )
          }
          className="h-20 bg-white hover:bg-slate-50 border-none shadow-lg shadow-slate-100 rounded-2xl flex items-center justify-between px-8 text-slate-900 group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black tracking-tight">
                Org Governance
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Manage Roles & Depts
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
        </Button>
        <Button
          onClick={() =>
            router.push(
              "/core/transaction3/admin/audit",
            )
          }
          className="h-20 bg-white hover:bg-slate-50 border-none shadow-lg shadow-slate-100 rounded-2xl flex items-center justify-between px-8 text-slate-900 group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <History className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black tracking-tight">
                System Audit
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Transaction History
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
        </Button>
      </div>

      {/* === KEY STATS === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            label: "Users",
            value: totalUsers.toString(),
            color: "blue",
            icon: (
              <Users className="h-3.5 w-3.5 text-blue-500" />
            ),
          },
          {
            label: "Sellers",
            value: totalSellers.toString(),
            color: "purple",
            icon: (
              <Store className="h-3.5 w-3.5 text-purple-500" />
            ),
          },
          {
            label: "Pending Payouts",
            value: `${pendingPayouts}`,
            color: "orange",
            icon: (
              <Banknote className="h-3.5 w-3.5 text-orange-500" />
            ),
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="border-none shadow-lg shadow-slate-100 rounded-2xl p-3 bg-white relative overflow-hidden"
          >
            <div
              className={`absolute -top-4 -right-4 h-16 w-16 bg-${s.color}-50 rounded-full blur-2xl opacity-40`}
            />
            <div className="flex items-center gap-1.5 mb-1.5">
              <div
                className={`h-6 w-6 bg-${s.color}-50 rounded-md flex items-center justify-center`}
              >
                {s.icon}
              </div>
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p
              className={`text-[8px] font-black uppercase tracking-widest text-${s.color}-600`}
            >
              {s.label}
            </p>
            <p className="text-lg font-black text-slate-900">
              {loading ? "..." : s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* === CHARTS (3 columns) === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-slate-300" />
              Order Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="flex items-end gap-1.5 h-24">
              {monthlyOrders.map((m) => (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <span className="text-[7px] font-black text-slate-500">
                    {m.count}
                  </span>
                  <div
                    className="w-full bg-slate-50 rounded-md overflow-hidden"
                    style={{ height: "65px" }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-md transition-all"
                      style={{
                        height: `${(m.count / maxMonth) * 100}%`,
                        marginTop: `${100 - (m.count / maxMonth) * 100}%`,
                        minHeight:
                          m.count > 0
                            ? "4px"
                            : "0",
                      }}
                    />
                  </div>
                  <span className="text-[7px] font-black text-slate-400">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-300" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="flex items-end gap-1.5 h-24">
              {userGrowth.map((m) => (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <span className="text-[7px] font-black text-slate-500">
                    {m.count}
                  </span>
                  <div
                    className="w-full bg-slate-50 rounded-md overflow-hidden"
                    style={{ height: "65px" }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-md transition-all"
                      style={{
                        height: `${(m.count / maxUser) * 100}%`,
                        marginTop: `${100 - (m.count / maxUser) * 100}%`,
                        minHeight:
                          m.count > 0
                            ? "4px"
                            : "0",
                      }}
                    />
                  </div>
                  <span className="text-[7px] font-black text-slate-400">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-slate-300" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0">
                <svg
                  viewBox="0 0 36 36"
                  className="h-full w-full -rotate-90"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={
                      healthScore > 70
                        ? "#10b981"
                        : healthScore > 40
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                    strokeWidth="3"
                    strokeDasharray={`${healthScore} ${100 - healthScore}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ShieldCheck
                    className={`h-3 w-3 mb-0.5 ${healthScore > 70 ? "text-emerald-500" : healthScore > 40 ? "text-amber-500" : "text-red-500"}`}
                  />
                  <p className="text-sm font-black text-slate-900">
                    {healthScore}%
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {[
                  {
                    label: "Completion Rate",
                    value: `${completionRate.toFixed(0)}%`,
                    ok: completionRate > 50,
                  },
                  {
                    label: "Approval Rate",
                    value: `${approvalRate.toFixed(0)}%`,
                    ok: approvalRate > 50,
                  },
                  {
                    label: "User/Seller Ratio",
                    value: `${userToSellerRatio.toFixed(0)}%`,
                    ok: userToSellerRatio > 5,
                  },
                  {
                    label: "Platform Revenue",
                    value: fmt(platformRevenue),
                    ok: platformRevenue > 0,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-1.5"
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${m.ok ? "bg-emerald-500" : "bg-red-400"}`}
                    />
                    <span className="text-[8px] font-black text-slate-500 flex-1">
                      {m.label}
                    </span>
                    <span className="text-[8px] font-black text-slate-900">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Payout Pipeline === */}
      <Card className="border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="p-4 border-b border-slate-50">
          <CardTitle className="text-xs font-black tracking-tight flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
            Payout Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {[
              {
                label: "Pending",
                count: pipelinePending,
                color: "bg-orange-500",
                textColor: "text-orange-600",
              },
              {
                label: "With Finance",
                count: pipelineApproved,
                color: "bg-blue-500",
                textColor: "text-blue-600",
              },
              {
                label: "Disbursed",
                count: pipelineCompleted,
                color: "bg-emerald-500",
                textColor: "text-emerald-600",
              },
            ].map((stage, i) => (
              <div
                key={stage.label}
                className="flex-1 flex items-center gap-2"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[9px] font-black uppercase ${stage.textColor}`}
                    >
                      {stage.label}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {stage.count}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all`}
                      style={{
                        width: `${totalPipeline > 0 ? (stage.count / totalPipeline) * 100 : 0}%`,
                        minWidth:
                          stage.count > 0
                            ? "8px"
                            : "0",
                      }}
                    />
                  </div>
                </div>
                {i < 2 && (
                  <span className="text-slate-200 font-black">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
            <span className="text-[9px] font-black text-slate-400 uppercase">
              Total Pipeline Value
            </span>
            <span className="text-sm font-black text-slate-900">
              {fmt(totalPayoutAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* === PAYOUT + ACTIVITY === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-4 border-b border-slate-50">
            <CardTitle className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-slate-300" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payoutSellers.length === 0 ? (
              <div className="p-5 text-center text-slate-400 font-bold italic text-[10px]">
                No pending payouts.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {payoutSellers.map((s) => (
                  <div
                    key={s.name}
                    className="p-3 flex items-center gap-2.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="h-7 w-7 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Store className="h-3 w-3 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-slate-900 text-[11px] block truncate">
                        {s.name}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold">
                        {s.orders} order
                        {s.orders > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="font-black text-orange-600 text-[11px]">
                      {fmt(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-lg shadow-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-300" />
              Recent Activity
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  "/core/transaction3/admin/audit",
                )
              }
              className="h-7 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg px-2"
            >
              View Full Audit
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {userLogGroups.length === 0 ? (
              <div className="p-5 text-center text-slate-400 font-bold italic text-[10px]">
                No activity yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        User
                      </th>
                      <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Actions
                      </th>
                      <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Last
                      </th>
                      <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {userLogGroups.map((g) => (
                      <tr
                        key={g.name}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 bg-slate-100 rounded-lg flex items-center justify-center">
                              <User className="h-3 w-3 text-slate-400" />
                            </div>
                            <span className="font-black text-slate-900 text-[11px]">
                              {g.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded">
                            {g.count}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${actionColors[g.lastAction] || "bg-slate-100 text-slate-600"}`}
                          >
                            {g.lastAction.replace(
                              /_/g,
                              " ",
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            onClick={() =>
                              setSelectedLogUser({
                                name: g.name,
                                logs: g.logs,
                              })
                            }
                            className="bg-slate-900 hover:bg-black text-white font-black text-[8px] uppercase rounded-lg h-6 gap-1 px-2"
                          >
                            <Eye className="h-2.5 w-2.5" />{" "}
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Log Detail Dialog */}
      <Dialog
        open={!!selectedLogUser}
        onOpenChange={(open) =>
          !open && setSelectedLogUser(null)
        }
      >
        <DialogContent className="max-w-xl max-h-[70vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
          <DialogHeader className="p-5 border-b border-slate-50 sticky top-0 bg-white z-10">
            <DialogTitle className="text-sm font-black tracking-tight flex items-center gap-2">
              <div className="h-7 w-7 bg-slate-100 rounded-lg flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-slate-500" />
              </div>
              {selectedLogUser?.name} — Activity
              Log
            </DialogTitle>
          </DialogHeader>
          <div className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Date
                  </th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Action
                  </th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedLogUser?.logs.map(
                  (log: any) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3 text-[9px] font-bold text-slate-500 whitespace-nowrap">
                        {new Date(
                          log.created_at,
                        ).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${actionColors[log.action] || "bg-slate-100 text-slate-600"}`}
                        >
                          {log.action.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-[9px] text-slate-500 font-bold space-y-0.5">
                          {log.details
                            ?.shop_name && (
                            <p>
                              Shop:{" "}
                              {
                                log.details
                                  .shop_name
                              }
                            </p>
                          )}
                          {log.details
                            ?.total_amount && (
                            <p>
                              Amount: ₱
                              {Number(
                                log.details
                                  .total_amount,
                              ).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </p>
                          )}
                          {log.details
                            ?.reference_number && (
                            <p>
                              Ref:{" "}
                              {
                                log.details
                                  .reference_number
                              }
                            </p>
                          )}
                          {log.details?.title && (
                            <p>
                              {log.details.title}
                            </p>
                          )}
                          {log.details
                            ?.plan_type && (
                            <p>
                              Plan:{" "}
                              {
                                log.details
                                  .plan_type
                              }
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
