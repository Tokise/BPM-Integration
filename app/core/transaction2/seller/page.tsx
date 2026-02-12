"use client";

import {
  ShoppingBag,
  Star,
  Package,
  MessageCircle,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/context/UserContext";
import { useMemo } from "react";

export default function SellerDashboard() {
  const { sellerProducts, sellerOrders, shop } =
    useUser();

  const stats = useMemo(() => {
    const productsCount =
      sellerProducts?.length || 0;
    const totalOrders = sellerOrders?.length || 0;
    const newOrders =
      sellerOrders?.filter(
        (o) =>
          o.status === "processing" ||
          o.status === "to_ship",
      ).length || 0;

    // Calculate revenue
    const totalRevenue =
      sellerOrders?.reduce((acc, order) => {
        if (order.status !== "cancelled") {
          return acc + (order.total_amount || 0);
        }
        return acc;
      }, 0) || 0;

    // Daily revenue (today's orders)
    const today = new Date()
      .toISOString()
      .split("T")[0];
    const dailyRevenue =
      sellerOrders?.reduce((acc, order) => {
        const orderDate = new Date(
          order.created_at,
        )
          .toISOString()
          .split("T")[0];
        if (
          orderDate === today &&
          order.status !== "cancelled"
        ) {
          return acc + (order.total_amount || 0);
        }
        return acc;
      }, 0) || 0;

    return {
      dailyRevenue: dailyRevenue.toLocaleString(
        "en-PH",
        {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        },
      ),
      newOrders: newOrders.toString(),
      activeProducts: productsCount.toString(),
      avgRating: "4.8/5", // Placeholder if not in DB
    };
  }, [sellerProducts, sellerOrders]);

  const recentSales = useMemo(() => {
    return (sellerOrders || []).slice(0, 5);
  }, [sellerOrders]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Seller Center
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Performance Overview & Shop Management
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Daily Revenue",
            value: stats.dailyRevenue,
            change: "+8.5%",
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "New Orders",
            value: stats.newOrders,
            change: "+12.2%",
            icon: ShoppingBag,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Active Products",
            value: stats.activeProducts,
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Avg Rating",
            value: stats.avgRating,
            icon: Star,
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
                className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            {stat.change && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <span
                  className={`${stat.color} flex items-center ${stat.bg} px-2 py-1 rounded-lg`}
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />{" "}
                  {stat.change}
                </span>
                <span className="text-slate-300">
                  vs yesterday
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black">
              Recent Store Sales
            </CardTitle>
          </CardHeader>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Order ID
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                    Earnings
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length > 0 ? (
                  recentSales.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <TableCell className="font-bold py-4">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black uppercase rounded-lg border border-blue-100">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-emerald-500 text-right">
                        {order.total_amount.toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                            maximumFractionDigits: 0,
                          },
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                    >
                      No recent sales
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Performance Pulse */}
        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden flex flex-col items-center justify-center text-center gap-6">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
            <TrendingUp className="h-10 w-10" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Store Performance
            </h3>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Monitoring your store's reach and
              growth in real-time.
            </p>
          </div>
          <div className="w-full pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Active Listings
              </p>
              <p className="text-xl font-black text-slate-900">
                {stats.activeProducts}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pending Orders
              </p>
              <p className="text-xl font-black text-slate-900">
                {stats.newOrders}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
