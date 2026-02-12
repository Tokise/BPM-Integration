"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
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
  Filter,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function SellerOrdersPage() {
  const {
    user,
    shopId: contextShopId,
    sellerOrders,
    refreshSellerOrders,
  } = useUser();
  const router = useRouter();
  const [loading, setLoading] =
    useState(!sellerOrders);
  const [shopId, setShopId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] =
    useState("");
  const [currentPage, setCurrentPage] =
    useState(1);
  const itemsPerPage = 6;

  // 1. Fetch Shop ID or use from context
  useEffect(() => {
    if (contextShopId) {
      setShopId(contextShopId);
    } else if (user?.id) {
      fetchShop();
    }
  }, [contextShopId, user?.id]);

  async function fetchShop() {
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user!.id)
      .single();

    if (data) {
      setShopId(data.id);
    } else {
      setLoading(false); // No shop found
    }
  }

  // 2. Fetch Orders on mount and when shopId changes
  useEffect(() => {
    if (shopId) {
      refreshSellerOrders().finally(() =>
        setLoading(false),
      );
    }
  }, [shopId]);

  // 3. Watch for changes in sellerOrders (e.g., from order detail page updates)
  useEffect(() => {
    // This ensures the component re-renders when sellerOrders changes
    // from other sources (like the order detail page updating status)
    if (sellerOrders) {
      setLoading(false);
    }
  }, [sellerOrders]);

  const orders = sellerOrders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "to_pay":
        return "bg-amber-50 text-amber-500 border-amber-100";
      case "to_ship":
        return "bg-blue-50 text-blue-500 border-blue-100";
      case "in_transit":
        return "bg-purple-50 text-purple-500 border-purple-100";
      case "completed":
        return "bg-emerald-50 text-emerald-500 border-emerald-100";
      case "cancelled":
        return "bg-red-50 text-red-500 border-red-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(
      dateString,
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      o.customer?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      o.customer?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(
    filteredOrders.length / itemsPerPage,
  );
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Calculate Stats
  const stats = {
    new_orders: orders.filter(
      (o) => o.status === "to_pay",
    ).length,
    to_ship: orders.filter(
      (o) => o.status === "to_ship",
    ).length,
    to_receive: orders.filter(
      (o) => o.status === "to_receive",
    ).length,
    completed: orders.filter(
      (o) => o.status === "completed",
    ).length,
  };

  return (
    <div className="space-y-9">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Manage Orders
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Track and fulfill customer orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-medium focus-visible:ring-primary"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                To Pay
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stats.new_orders}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                To Ship
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stats.to_ship}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                To Receive
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stats.to_receive}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Completed
              </p>
              <p className="text-2xl font-black text-slate-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-black">
            All Orders
          </CardTitle>
        </CardHeader>
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold">
              No orders found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Order ID
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Customer
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Date
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Amount
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/core/transaction2/seller/orders/${order.id}`,
                      )
                    }
                  >
                    <TableCell className="font-bold py-4">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {order.customer
                        ?.full_name || "Guest"}
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold">
                      {formatDate(
                        order.created_at,
                      )}
                    </TableCell>
                    <TableCell className="font-black">
                      {formatCurrency(
                        order.total_amount,
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border ${getStatusColor(order.status)}`}
                      >
                        {order.status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Showing{" "}
              {(currentPage - 1) * itemsPerPage +
                1}{" "}
              to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredOrders.length,
              )}{" "}
              of {filteredOrders.length} entries
            </p>
            <div className="flex items-center gap-2">
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <Button
                  key={page}
                  variant="outline"
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={cn(
                    "h-10 w-10 rounded-xl font-bold border-none shadow-none",
                    currentPage === page
                      ? "bg-slate-100 text-slate-900"
                      : "bg-transparent text-slate-400",
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
