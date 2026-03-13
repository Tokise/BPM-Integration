"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ScanLine,
  Truck,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrivacyMask } from "@/components/ui/privacy-mask";

export default function WarehouseEmployeeDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingInbound: 0,
    activePicking: 0,
    lowStock: 0,
  });
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch stats
    const [inboundRes, pickingRes, stockRes] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("shipments")
          .select("id", { count: "exact" })
          .eq("status", "pending_inbound"),
        supabase
          .schema("bpm-anec-global")
          .from("shipments")
          .select("id", { count: "exact" })
          .eq("status", "fbs_dispatched"),
        supabase
          .schema("bpm-anec-global")
          .from("warehouse_inventory")
          .select("id")
          .lte("quantity", 5), // Simplified low stock
      ]);

    setStats({
      pendingInbound: inboundRes.count || 0,
      activePicking: pickingRes.count || 0,
      lowStock: stockRes.data?.length || 0,
    });

    // Fetch recent tasks/shipments
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select(
        `
        *,
        products(name, barcode)
      `,
      )
      .in("status", [
        "pending_inbound",
        "fbs_dispatched",
      ])
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setTasks(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept1"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept1/warehouse"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Warehouse
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Staff Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Staff Portal
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Warehouse Ops • Dept 1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(
                "/logistic/dept1/warehouse/receive",
              )
            }
            className="bg-slate-900 text-white font-black rounded-lg h-10 px-6 shadow-sm hover:scale-[1.01] transition-transform text-[10px] uppercase tracking-widest"
          >
            <ScanLine className="h-4 w-4 mr-2 text-indigo-400" />{" "}
            Quick Receive
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Pending Receiving",
            val: stats.pendingInbound,
            icon: ArrowDownToLine,
            color: "blue",
            tag: "Inbound",
          },
          {
            label: "Active Pick List",
            val: stats.activePicking,
            icon: Package,
            color: "indigo",
            tag: "Picking",
          },
          {
            label: "Low Stock Alerts",
            val: stats.lowStock,
            icon: AlertTriangle,
            color: "rose",
            tag: "Urgent",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-lg overflow-hidden bg-white"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    stat.color === "blue" &&
                      "bg-blue-50 text-blue-600",
                    stat.color === "indigo" &&
                      "bg-indigo-50 text-indigo-600",
                    stat.color === "rose" &&
                      "bg-rose-50 text-rose-600",
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                    stat.color === "blue" &&
                      "bg-blue-50 text-blue-600 border-blue-100",
                    stat.color === "indigo" &&
                      "bg-indigo-50 text-indigo-600 border-indigo-100",
                    stat.color === "rose" &&
                      "bg-rose-50 text-rose-600 border-rose-100",
                  )}
                >
                  {stat.tag}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
              Operation Cue
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="pr-10 h-9 text-[10px] rounded-lg bg-white border-slate-200 uppercase font-black tracking-widest"
                  placeholder="Filter tasks..."
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 text-slate-400 rounded-lg border-slate-200"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50">
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Type
                      </th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Task / Shipment
                      </th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Status
                      </th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center animate-pulse text-slate-400 font-bold"
                        >
                          Loading tasks...
                        </td>
                      </tr>
                    ) : tasks.length > 0 ? (
                      tasks.map((task) => (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-4">
                            {task.status ===
                            "pending_inbound" ? (
                              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <ArrowDownToLine className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                <ArrowUpFromLine className="h-4 w-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-black text-slate-900 uppercase">
                              {
                                task.products
                                  ?.name
                              }
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                              ID:{" "}
                              {task.id.slice(
                                0,
                                8,
                              )}{" "}
                              • Barcode:{" "}
                              <PrivacyMask
                                value={
                                  task.products
                                    ?.barcode ||
                                  "—"
                                }
                              />
                            </p>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                task.status ===
                                  "pending_inbound"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-blue-50 text-blue-600 border-blue-100",
                              )}
                            >
                              {task.status.replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-md text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                            >
                              View Task
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center text-slate-400 font-bold uppercase text-[10px]"
                        >
                          No active tasks
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            Current Health
          </h2>
          <Card className="border shadow-sm rounded-lg overflow-hidden bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Accuracy
              </h4>
              <span className="text-xs font-black text-indigo-600">
                99.2%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[99.2%]" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                  Received Today
                </p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  124
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                  Picked Today
                </p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  86
                </p>
              </div>
            </div>
          </Card>

          <Card className="border shadow-sm rounded-lg overflow-hidden bg-slate-900 p-6 text-white relative group">
            <div className="absolute top-0 right-0 h-full w-24 bg-white/5 skew-x-12 translate-x-8 group-hover:bg-white/10 transition-colors" />
            <div className="relative space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-colors"
                >
                  Report Discrepancy
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-colors"
                >
                  Print Labels
                  <ScanLine className="h-3.5 w-3.5 text-emerald-400" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
