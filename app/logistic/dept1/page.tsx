"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Package,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Layers,
  Box,
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
import { cn } from "@/lib/utils";

export default function Dept1Dashboard() {
  const { profile } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    stockInWarehouse: 0,
    activeShipments: 0,
    deliveredShipments: 0,
    pendingInbound: 0,
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
      const [
        shipmentsRes,
        inventoryRes,
        inboundRes,
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
          .from("warehouse_inventory")
          .select("quantity"),
        supabase
          .schema("bpm-anec-global")
          .from("shipments")
          .select("id")
          .eq("shipment_type", "fbs_inbound")
          .in("status", [
            "requested",
            "pending_inbound",
            "fbs_in_transit",
            "fbs_dispatched",
            "fbs_forwarded_to_fleet",
          ]),
      ]);

      const shipments = shipmentsRes.data || [];
      const inventory = inventoryRes.data || [];
      const inbound = inboundRes.data || [];

      // Calculate stats
      const stockInWarehouse = inventory.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );
      const activeShipments = shipments.filter(
        (s) =>
          ![
            "delivered",
            "completed",
            "cancelled",
            "failed",
          ].includes(s.status),
      ).length;
      const deliveredShipments = shipments.filter(
        (s) => ["delivered", "completed"].includes(s.status),
      ).length;
      const pendingInboundCount = inbound.length;

      setMetrics({
        stockInWarehouse,
        activeShipments,
        deliveredShipments,
        pendingInbound: pendingInboundCount,
      });

      // Recent Activity
      setRecentActivity(shipments.slice(0, 5));

      // Chart Data: Last 7 days of shipments
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
        if (["delivered", "completed"].includes(s.status)) {
          const sDate = new Date(s.created_at);
          const dayMatch = last7Days.find((d) =>
            isSameDay(d.date, sDate),
          );
          if (dayMatch) {
            dayMatch.shipments += 1;
          }
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
      case "completed":
        return "bg-emerald-50 text-emerald-600";
      case "in_transit":
        return "bg-blue-50 text-blue-600";
      case "pending":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const stats = [
    {
      title: "Warehouse Stock",
      value: loading
        ? "..."
        : metrics.stockInWarehouse.toLocaleString(),
      icon: Warehouse,
      change: "+5.1%",
      tr: "up",
      color: "blue",
    },
    {
      title: "Pending Inbound",
      value: loading
        ? "..."
        : metrics.pendingInbound.toLocaleString(),
      icon: Layers,
      change: "+12%",
      tr: "up",
      color: "indigo",
    },
    {
      title: "Active Outbound",
      value: loading
        ? "..."
        : metrics.activeShipments.toLocaleString(),
      icon: Package,
      change: "-2.1%",
      tr: "down",
      color: "rose",
    },
    {
      title: "Total Delivered",
      value: loading
        ? "..."
        : metrics.deliveredShipments.toLocaleString(),
      icon: Box,
      change: "+18%",
      tr: "up",
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Inbound Ops
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Warehouse & Sourcing • Dept 1
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-lg overflow-hidden bg-white"
          >
            <CardContent className="p-5">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors",
                  stat.color === "blue" &&
                    "bg-blue-50 text-blue-600",
                  stat.color === "indigo" &&
                    "bg-indigo-50 text-indigo-600",
                  stat.color === "rose" &&
                    "bg-rose-50 text-rose-600",
                  stat.color === "emerald" &&
                    "bg-emerald-50 text-emerald-600",
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                {stat.title}
              </p>
              <h3 className="text-2xl font-black text-slate-900 leading-none">
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
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                )}
                {stat.tr === "down" && (
                  <ArrowDownRight className="h-3 w-3 text-rose-500" />
                )}
                <span
                  className={`text-[9px] font-bold uppercase tracking-tight ${
                    stat.tr === "up"
                      ? "text-emerald-500"
                      : stat.tr === "down"
                        ? "text-rose-500"
                        : "text-slate-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        defaultValue="overview"
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4 mt-2">
          <TabsList className="bg-slate-100/50 p-1 h-10 rounded-lg">
            <TabsTrigger
              value="overview"
              className="rounded-md px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-md px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Live Feed
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6 m-0"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border shadow-sm rounded-lg lg:col-span-2 overflow-hidden bg-white p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Fulfillment Trend
                  </h2>
                </div>
              </div>
              <div className="h-[300px] w-full mt-4">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-200 font-black animate-pulse">
                    ...
                  </div>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart data={chartData}>
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
                          borderRadius: "8px",
                          border:
                            "1px solid #f1f5f9",
                          boxShadow:
                            "0 2px 4px rgba(0,0,0,0.05)",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="shipments"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.05}
                        activeDot={{
                          r: 4,
                          strokeWidth: 0,
                          fill: "#2563eb",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="border shadow-sm rounded-lg overflow-hidden bg-white p-6">
              <h2 className="text-xs font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                <Calendar className="h-4 w-4 text-amber-500" />
                Operations Summary
              </h2>
              <div className="space-y-4">
                {[
                  {
                    label: "Inventory Accuracy",
                    val: "98.2%",
                    color: "blue",
                  },
                  {
                    label: "Dispatch Latency",
                    val: "2.4 hrs",
                    color: "indigo",
                  },
                  {
                    label: "Pick Accuracy",
                    val: "99.9%",
                    color: "emerald",
                  },
                  {
                    label: "Damaged Items",
                    val: "0.12%",
                    color: "rose",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100"
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-xs font-black text-slate-900">
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="activity"
          className="m-0"
        >
          <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="w-full text-center py-10 text-slate-200 font-black animate-pulse uppercase tracking-widest text-[10px]">
                    Updating...
                  </div>
                ) : (
                  recentActivity.map(
                    (activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-900 truncate uppercase">
                              {activity.shipment_type ===
                              "fbs_inbound"
                                ? "INBOUND"
                                : "OUTBOUND"}
                              :{" "}
                              {
                                activity.tracking_number
                              }
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
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
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tight",
                            getStatusColor(
                              activity.status,
                            ),
                          )}
                        >
                          {activity.status.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>
                    ),
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
