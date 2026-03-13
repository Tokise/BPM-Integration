"use client";

import {
  ShoppingBag,
  Package,
  Warehouse,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Truck,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function FBSDashboard() {
  const { sellerProducts, sellerOrders, shop } =
    useUser();
  const supabase = createClient();
  const router = useRouter();
  const [warehouseStock, setWarehouseStock] =
    useState(0);
  const [pendingInbound, setPendingInbound] =
    useState(0);

  useEffect(() => {
    if (shop?.id) fetchWarehouseData();
  }, [shop]);

  const fetchWarehouseData = async () => {
    const { data: inv } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .select("quantity")
      .eq("shop_id", shop.id);

    if (inv) {
      setWarehouseStock(
        inv.reduce(
          (a: number, i: any) =>
            a + (i.quantity || 0),
          0,
        ),
      );
    }

    // Count products with 0 stock as "pending inbound"
    const zeroStock =
      sellerProducts?.filter(
        (p: any) => (p.stock_qty || 0) === 0,
      ).length || 0;
    setPendingInbound(zeroStock);
  };

  const stats = useMemo(() => {
    const totalOrders = sellerOrders?.length || 0;
    const fulfilledOrders =
      sellerOrders?.filter(
        (o: any) =>
          o.status === "delivered" ||
          o.status === "completed",
      ).length || 0;
    const totalRevenue =
      sellerOrders?.reduce(
        (acc: number, o: any) => {
          if (o.status !== "cancelled")
            return acc + (o.total_amount || 0);
          return acc;
        },
        0,
      ) || 0;

    return {
      totalRevenue: totalRevenue.toLocaleString(
        "en-PH",
        {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        },
      ),
      totalOrders,
      fulfilledOrders,
      activeProducts: sellerProducts?.length || 0,
    };
  }, [sellerProducts, sellerOrders]);

  const recentOrders = useMemo(() => {
    return (sellerOrders || [])
      .filter(
        (o) =>
          o.fulfillment_type === "warehouse" ||
          o.shop_id === shop?.id,
      ) // Adjust filter as needed
      .slice(0, 5);
  }, [sellerOrders, shop?.id]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          FBS Center
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Fulfilled by Store — Warehouse
          Operations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Warehouse Stock",
            value: warehouseStock.toString(),
            change: "Total units",
            icon: Warehouse,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Pending Inbound",
            value: pendingInbound.toString(),
            change: "Awaiting receipt",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Total Revenue",
            value: stats.totalRevenue,
            change: `${stats.fulfilledOrders} fulfilled`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Active Products",
            value:
              stats.activeProducts.toString(),
            change: "In FBS catalog",
            icon: Package,
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="border border-slate-200 shadow-none rounded-lg overflow-hidden group hover:border-slate-300 transition-all duration-300 p-6 bg-white"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {stat.value}
                </h3>
              </div>
              <div
                className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className={`text-slate-400`}>
                {stat.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-none rounded-lg p-0 bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Live Fulfillment Feed
            </h3>
            <ArrowUpRight className="h-4 w-4 text-slate-300" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-50 bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-8 py-4">
                    Reference
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Lifecycle
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">
                    Settlement
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-slate-50 hover:bg-slate-50/30 cursor-pointer transition-all group"
                      onClick={() =>
                        router.push(
                          `/core/transaction2/fbs/orders/${order.id}`,
                        )
                      }
                    >
                      <TableCell className="pl-8 py-5">
                        <p className="font-black text-slate-900 text-sm">
                          {[
                            "to_pay",
                            "to_ship",
                          ].includes(order.status)
                            ? order.order_number ||
                              `#${order.id.slice(0, 8)}`
                            : order.tracking_number ||
                              `FBS-TRK-${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                          {new Date(
                            order.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border shadow-none rounded-md",
                            order.status ===
                              "to_pay"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : order.status ===
                                  "to_ship"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : "bg-slate-50 text-slate-600 border-slate-100",
                          )}
                          variant="outline"
                        >
                          {order.status.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <p className="font-black text-slate-900 text-sm">
                          {order.total_amount.toLocaleString(
                            "en-PH",
                            {
                              style: "currency",
                              currency: "PHP",
                              maximumFractionDigits: 0,
                            },
                          )}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-slate-400 font-black uppercase text-[10px] tracking-widest"
                    >
                      No recent orders detected
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* How FBS Works */}
        <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-400" />
              Operations
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Add Products",
                desc: "List your products in FBS Inventory.",
              },
              {
                step: "2",
                title: "Inbound",
                desc: "Send inventory to our warehouse.",
              },
              {
                step: "3",
                title: "Fulfillment",
                desc: "We pick, pack, and ship orders.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="h-7 w-7 bg-amber-50 rounded-lg flex items-center justify-center font-black text-amber-600 text-[10px] shrink-0 border border-amber-100">
                  {s.step}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Fulfilled Orders
              </p>
              <p className="text-xl font-black text-emerald-600">
                {stats.fulfilledOrders}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    stats.totalOrders > 0
                      ? (stats.fulfilledOrders /
                          stats.totalOrders) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
