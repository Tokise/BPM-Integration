"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Truck,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Banknote,
  Navigation,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  format,
  subDays,
  isSameDay,
} from "date-fns";

export default function Dept2Dashboard() {
  const { profile } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    activeDeliveries: 0,
    totalVehicles: 0,
    activeDrivers: 0,
    monthlyExpenses: 0,
  });

  const [recentActivity, setRecentActivity] =
    useState<any[]>([]);
  const [chartData, setChartData] = useState<
    any[]
  >([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        shipmentsRes,
        vehiclesRes,
        driversRes,
        expensesRes,
      ] = await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("shipments")
          .select(
            "id, status, created_at, tracking_number, shipment_type",
          )
          .order("created_at", {
            ascending: false,
          }),
        supabase
          .schema("bpm-anec-global")
          .from("vehicles")
          .select("id")
          .not("status", "eq", "out_of_service"),
        supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id")
          .eq("role", "driver"),
        supabase
          .schema("bpm-anec-global")
          .from("financial_ledger")
          .select("amount")
          .in("category", [
            "Logistics - Fuel",
            "Logistics - Maintenance",
            "Logistics - Other",
          ])
          .gte(
            "transaction_date",
            startOfMonth.toISOString(),
          ),
      ]);

      const shipments = shipmentsRes.data || [];
      const vehicles = vehiclesRes.data || [];
      const drivers = driversRes.data || [];
      const expenses = expensesRes.data || [];

      // Calculate stats
      const activeDeliveries = shipments.filter(
        (s) =>
          ![
            "delivered",
            "cancelled",
            "failed",
          ].includes(s.status),
      ).length;

      const monthlyExpenses = expenses.reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0,
      );

      setMetrics({
        activeDeliveries,
        totalVehicles: vehicles.length,
        activeDrivers: drivers.length,
        monthlyExpenses,
      });

      // Recent Activity
      setRecentActivity(shipments.slice(0, 5));

      // Chart Data: Last 7 days of active dispatches
      const last7Days = Array.from(
        { length: 7 },
        (_, i) => {
          const d = subDays(new Date(), 6 - i);
          return {
            date: d,
            displayDate: format(d, "MMM dd"),
            shipments: 0,
          };
        },
      );

      shipments.forEach((s) => {
        const sDate = new Date(s.created_at);
        const dayMatch = last7Days.find((d) =>
          isSameDay(d.date, sDate),
        );
        if (dayMatch) {
          dayMatch.shipments += 1;
        }
      });

      setChartData(last7Days);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-600";
      case "in_transit":
      case "fbs_in_transit":
        return "bg-blue-50 text-blue-600";
      case "pending":
      case "requested":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const stats = [
    {
      title: "Active Deliveries",
      value: loading
        ? "..."
        : metrics.activeDeliveries.toLocaleString(),
      icon: Navigation,
      change: "+3.2%",
      tr: "up",
    },
    {
      title: "Total Fleet",
      value: loading
        ? "..."
        : metrics.totalVehicles.toLocaleString(),
      icon: Truck,
      change: "0%",
      tr: "neutral",
    },
    {
      title: "Active Personnel",
      value: loading
        ? "..."
        : metrics.activeDrivers.toLocaleString(),
      icon: Users,
      change: "+2.1%",
      tr: "up",
    },
    {
      title: "Monthly Expenses",
      value: loading
        ? "..."
        : `₱${metrics.monthlyExpenses.toLocaleString()}`,
      icon: Banknote,
      change: "-5.4%",
      tr: "down",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Fleet & Operations
        </h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
          Logistics Department 2: Fleet &
          Personnel Management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] overflow-hidden group transition-all bg-white"
          >
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2 space-y-0 relative">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                {stat.title}
              </CardTitle>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-3xl font-black text-slate-900">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {stat.tr === "up" && (
                  <ArrowUpRight className="h-3 w-4 text-emerald-500" />
                )}
                {stat.tr === "down" && (
                  <ArrowDownRight className="h-3 w-4 text-emerald-500" />
                )}
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${stat.tr === "up" ? "text-emerald-500" : stat.tr === "down" ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {stat.change} vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Chart Section */}
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] lg:col-span-2 overflow-hidden bg-white p-8 group relative">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500 opacity-5 blur-[100px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-10" />
          <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">
                Fleet Dispatch Volume
              </CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-muted-foreground">
                Dispatched Shipments (Last 7 Days)
              </p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">
                Loading Data...
              </div>
            ) : chartData.every(
                (d) => d.shipments === 0,
              ) ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                <Calendar className="w-8 h-8 mb-2 opacity-20" />
                <p className="font-bold text-xs uppercase tracking-widest">
                  No Dispatch Data Found
                </p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="colorShipments"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="displayDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                      fontWeight: 700,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                      fontWeight: 700,
                    }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow:
                        "0 10px 40px -10px rgba(0,0,0,0.1)",
                      fontWeight: "900",
                    }}
                    cursor={{
                      stroke: "#e2e8f0",
                      strokeWidth: 2,
                      strokeDasharray: "3 3",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="shipments"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorShipments)"
                    activeDot={{
                      r: 8,
                      strokeWidth: 0,
                      fill: "#2563eb",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] p-8 bg-slate-50 flex flex-col">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl font-black">
              Recent Activity
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Live Feed
            </p>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="space-y-4">
              {loading ? (
                <div className="w-full text-center py-10 text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">
                  Syncing logs...
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="w-full text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No activity found
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-slate-100/50"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">
                        {activity.shipment_type ===
                        "fbs_inbound"
                          ? "Fleet Dispatch"
                          : "Customer Delivery"}
                        :{" "}
                        {activity.tracking_number ||
                          "TBD"}
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5 tracking-widest">
                        {format(
                          new Date(
                            activity.created_at,
                          ),
                          "MMM d, h:mm a",
                        )}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 shrink-0 ${getStatusColor(activity.status)} text-[9px] font-black rounded uppercase tracking-wider`}
                    >
                      {activity.status.replace(
                        "_",
                        " ",
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
