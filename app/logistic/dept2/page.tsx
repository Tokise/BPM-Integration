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
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
            Fleet Control
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
            Asset & Personnel • Dept 2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 hover:bg-slate-50"
          >
            Dispatch Schedule
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl h-11 px-6 shadow-lg">
            Add Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-xl overflow-hidden group hover:scale-[1.01] transition-all bg-white relative"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20" />
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                {stat.title}
              </p>
              <h3 className="text-3xl font-black text-slate-900 leading-none">
                {loading ? (
                  <span className="animate-pulse text-slate-100">
                    ...
                  </span>
                ) : (
                  <PrivacyMask
                    value={stat.value}
                  />
                )}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                {stat.tr === "up" && (
                  <ArrowUpRight className="h-3 w-4 text-emerald-500" />
                )}
                {stat.tr === "down" && (
                  <ArrowDownRight className="h-3 w-4 text-emerald-500" />
                )}
                <span
                  className={`text-[9px] font-bold uppercase tracking-tight ${stat.tr === "up" ? "text-emerald-500" : stat.tr === "down" ? "text-emerald-500" : "text-slate-400"}`}
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
        <Card className="border shadow-sm rounded-xl lg:col-span-2 overflow-hidden bg-white">
          <CardContent className="p-6">
            <h2 className="text-sm font-black text-slate-900 mb-6 flex items-center justify-between uppercase tracking-widest">
              Dispatch Volume
              <Activity className="h-4 w-4 text-blue-500" />
            </h2>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-100 font-black animate-pulse">
                  ...
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart data={chartData}>
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
                          stopOpacity={0.1}
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
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="shipments"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorShipments)"
                      activeDot={{
                        r: 6,
                        strokeWidth: 0,
                        fill: "#2563eb",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <h2 className="text-sm font-black text-slate-900 mb-6 flex items-center justify-between uppercase tracking-widest">
              Live Feed
              <Activity className="h-4 w-4 text-emerald-500" />
            </h2>
            <div className="space-y-3">
              {loading ? (
                <div className="w-full text-center py-6 text-slate-100 font-black animate-pulse">
                  ...
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate uppercase">
                          {activity.shipment_type ===
                          "fbs_inbound"
                            ? "ASSET"
                            : "DELIV"}
                          :{" "}
                          {
                            activity.tracking_number
                          }
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                          {format(
                            new Date(
                              activity.created_at,
                            ),
                            "MMM d, h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getStatusColor(activity.status)}`}
                    >
                      {activity.status.replace(
                        "_",
                        " ",
                      )}
                    </span>
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
