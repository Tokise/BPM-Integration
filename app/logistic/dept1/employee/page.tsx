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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/logistic/dept1/warehouse">
                Warehouse
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Staff Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Staff Portal
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Warehouse Ops • Inventory Handling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(
                "/logistic/dept1/warehouse/receive",
              )
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-indigo-100"
          >
            <ScanLine className="h-4 w-4 mr-2" />{" "}
            Quick Receive
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                Inbound
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Pending Receiving
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {stats.pendingInbound}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                Picking
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Active Pick List
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {stats.activePicking}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase">
                Urgent
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Low Stock Alerts
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {stats.lowStock}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              Operation Cue
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="pl-8 h-8 text-xs rounded-lg bg-slate-50 border-none"
                  placeholder="Filter tasks..."
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Type
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Task / Shipment
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Status
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
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
                              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ArrowDownToLine className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <ArrowUpFromLine className="h-4 w-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-black text-slate-900">
                              {
                                task.products
                                  ?.name
                              }
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              Barcode:{" "}
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
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                task.status ===
                                "pending_inbound"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
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
                              className="h-8 rounded-lg text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                            >
                              Go to task{" "}
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
          <h2 className="text-xl font-black text-slate-900">
            Current Health
          </h2>
          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Inventory Accuracy
              </h4>
              <span className="text-xs font-black text-indigo-600">
                99.2%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[99.2%]" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Received Today
                </p>
                <p className="text-lg font-black text-slate-900">
                  124
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Picked Today
                </p>
                <p className="text-lg font-black text-slate-900">
                  86
                </p>
              </div>
            </div>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden bg-slate-900 p-6 text-white relative">
            <div className="absolute top-0 right-0 h-full w-24 bg-indigo-600/20 skew-x-12 translate-x-8" />
            <div className="relative space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 border-white/10 hover:bg-white/5 text-white font-bold text-xs rounded-lg"
                >
                  Report Stock Discrepancy{" "}
                  <AlertTriangle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 border-white/10 hover:bg-white/5 text-white font-bold text-xs rounded-lg"
                >
                  Print Shelf Labels{" "}
                  <ScanLine className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
