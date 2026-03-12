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
            "cancelled",
            "failed",
          ].includes(s.status),
      ).length;
      const deliveredShipments = shipments.filter(
        (s) => s.status === "delivered",
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
        if (s.status === "delivered") {
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
    },
    {
      title: "Pending Inbound",
      value: loading
        ? "..."
        : metrics.pendingInbound.toLocaleString(),
      icon: Layers,
      change: "+12%",
      tr: "up",
    },
    {
      title: "Active Outbound",
      value: loading
        ? "..."
        : metrics.activeShipments.toLocaleString(),
      icon: Package,
      change: "-2.1%",
      tr: "down",
    },
    {
      title: "Total Delivered",
      value: loading
        ? "..."
        : metrics.deliveredShipments.toLocaleString(),
      icon: Box,
      change: "+18%",
      tr: "up",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
            Inbound Ops
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
            Warehouse & Sourcing • Dept 1
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 hover:bg-slate-50"
          >
            Inventory Audit
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl h-11 px-6 shadow-lg">
            Batch Receive
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
                  <ArrowDownRight className="h-3 w-4 text-rose-500" />
                )}
                <span
                  className={`text-[9px] font-bold uppercase tracking-tight ${stat.tr === "up" ? "text-emerald-500" : stat.tr === "down" ? "text-rose-500" : "text-slate-400"}`}
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
              Fulfillment Trend
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
                        <Package className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate uppercase">
                          {activity.shipment_type ===
                          "fbs_inbound"
                            ? "IN"
                            : "OUT"}
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
