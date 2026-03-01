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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/utils/supabase/client";

export default function FBSDashboard() {
  const { sellerProducts, sellerOrders, shop } =
    useUser();
  const supabase = createClient();
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Warehouse className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">
              FBS Center
            </h1>
            <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
              Fulfilled by Store — Warehouse
              Operations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Warehouse Stock",
            value: warehouseStock.toString(),
            sub: "Total units stored",
            icon: Warehouse,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Pending Inbound",
            value: pendingInbound.toString(),
            sub: "Awaiting warehouse receipt",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Total Revenue",
            value: stats.totalRevenue,
            sub: `${stats.fulfilledOrders} orders fulfilled`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Active Products",
            value:
              stats.activeProducts.toString(),
            sub: "In FBS catalog",
            icon: Package,
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-300 p-6 bg-white"
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
                className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              {stat.sub}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-400" />
              How FBS Works
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {[
              {
                step: "1",
                title: "Add Products",
                desc: "List your products in FBS Products. Stock starts at 0.",
              },
              {
                step: "2",
                title: "Ship to Warehouse",
                desc: "Send bulk inventory to our warehouse for storage.",
              },
              {
                step: "3",
                title: "We Handle the Rest",
                desc: "We pick, pack, and ship via our fleet when orders come in.",
              },
              {
                step: "4",
                title: "Auto-Replenishment",
                desc: "When stock runs low, we'll send you a PO request.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center font-black text-primary text-sm shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">
                    {s.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden flex flex-col items-center justify-center text-center gap-6">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
            <TrendingUp className="h-10 w-10" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Warehouse Performance
            </h3>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Your products are being stored and
              fulfilled by our logistics team.
            </p>
          </div>
          <div className="w-full pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Orders
              </p>
              <p className="text-xl font-black text-slate-900">
                {stats.totalOrders}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Fulfilled
              </p>
              <p className="text-xl font-black text-emerald-600">
                {stats.fulfilledOrders}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
