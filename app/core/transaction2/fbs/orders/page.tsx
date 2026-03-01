"use client";

import { useUser } from "@/context/UserContext";
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
import {
  Package,
  Search,
  Eye,
  Truck,
  Clock,
  CheckCircle2,
  Warehouse,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function FBSOrdersPage() {
  const { shop, sellerOrders } = useUser();
  const [search, setSearch] = useState("");

  const orders = useMemo(
    () => sellerOrders || [],
    [sellerOrders],
  );

  const filtered = orders.filter(
    (o: any) =>
      o.order_number
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      o.status
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "bg-emerald-50 text-emerald-600";
      case "shipping":
      case "to_ship":
        return "bg-blue-50 text-blue-600";
      case "processing":
        return "bg-amber-50 text-amber-600";
      case "cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  const counts = {
    processing: orders.filter(
      (o: any) =>
        o.status === "processing" ||
        o.status === "to_ship",
    ).length,
    shipping: orders.filter(
      (o: any) => o.status === "shipping",
    ).length,
    delivered: orders.filter(
      (o: any) =>
        o.status === "delivered" ||
        o.status === "completed",
    ).length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          FBS Orders
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
          Orders fulfilled by warehouse —
          read-only monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Processing",
            val: counts.processing,
            icon: Clock,
            color: "amber",
            sub: "Warehouse is picking",
          },
          {
            label: "In Transit",
            val: counts.shipping,
            icon: Truck,
            color: "blue",
            sub: "Shipped via fleet",
          },
          {
            label: "Delivered",
            val: counts.delivered,
            icon: CheckCircle2,
            color: "emerald",
            sub: "Completed orders",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white relative group overflow-hidden p-6"
          >
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-xl bg-${s.color}-50 flex items-center justify-center text-${s.color}-600`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {s.val}
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  {s.sub}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search orders..."
              className="pl-10 h-11 rounded-xl bg-white border-none font-medium shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
            <Warehouse className="h-3 w-3" />
            Warehouse Managed
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/50">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Order #
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Amount
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Date
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-5">
                  Fulfilled By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="p-5 font-black text-slate-900">
                      {order.order_number}
                    </TableCell>
                    <TableCell className="p-5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 font-black text-emerald-600">
                      ₱
                      {Number(
                        order.total_amount,
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell className="p-5 text-xs font-bold text-slate-400">
                      {new Date(
                        order.created_at,
                      ).toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell className="p-5">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded w-fit">
                        <Warehouse className="h-2.5 w-2.5" />
                        Warehouse
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center p-12"
                  >
                    <Package className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      No FBS orders yet
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
