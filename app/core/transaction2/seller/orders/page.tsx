"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  XCircle,
  ChevronRight,
  TrendingUp,
  Archive,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { autoCompleteDeliveredOrders } from "@/app/actions/seller";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { archiveOrder } from "@/app/actions/orders";

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
  const itemsPerPage = 8;

  // 1. Fetch Shop ID or use from context
  useEffect(() => {
    if (contextShopId) {
      setShopId(contextShopId);
    } else if (user?.id) {
      fetchShop();
    }
  }, [contextShopId, user?.id]);

  async function fetchShop() {
    const { data } = await supabase
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
      // Auto-complete orders delivered > 24h ago
      autoCompleteDeliveredOrders(shopId).then(
        (res) => {
          if (
            res.success &&
            res.successCount &&
            res.successCount > 0
          ) {
            toast.success(
              `Automatically completed ${res.successCount} overdue orders`,
            );
            refreshSellerOrders();
          }
        },
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

  // 4. Real-time Subscription
  useEffect(() => {
    if (!shopId) return;

    const channel = supabase
      .channel(`seller-orders-realtime-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          refreshSellerOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, refreshSellerOrders]);

  const handleArchive = async (id: string) => {
    const toastId = toast.loading("Archiving order...");
    try {
      const res = await archiveOrder(id);
      if (res.success) {
        toast.success("Order archived", { id: toastId });
        refreshSellerOrders();
      } else {
        toast.error(res.error || "Failed to archive", { id: toastId });
      }
    } catch (error) {
      toast.error("An error occurred", { id: toastId });
    }
  };

  const orders = sellerOrders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "to_pay":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "to_ship":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "in_transit":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "to_receive":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "delivered":
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
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
      o.status !== "archived" &&
      (o.id
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        o.customer?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        o.customer?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (o.order_number &&
          o.order_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))),
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
    to_pay: orders.filter(
      (o) => o.status === "to_pay",
    ).length,
    to_ship: orders.filter(
      (o) => o.status === "to_ship",
    ).length,
    to_receive: orders.filter(
      (o) => o.status === "to_receive",
    ).length,
    completed: orders.filter(
      (o) => ["delivered", "completed"].includes(o.status),
    ).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        <Link
          href="/core/transaction2/seller"
          className="hover:text-primary transition-colors"
        >
          DASHBOARD
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          ORDER MANAGEMENT
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Orders
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            TRACK REVENUE & FULFILLMENT PIPELINE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              className="pl-12 h-12 w-[300px] rounded-lg bg-white border border-slate-200 font-bold text-slate-900 focus-visible:ring-primary shadow-sm"
              placeholder="SEARCH ORDERS..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            className="h-12 w-12 rounded-lg border-slate-200 p-0 text-slate-400 hover:text-slate-900"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Pending Payment",
            value: stats.to_pay,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Must Ship",
            value: stats.to_ship,
            icon: Package,
            color: "blue",
          },
          {
            label: "In Transit",
            value: stats.to_receive,
            icon: Truck,
            color: "purple",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle2,
            color: "emerald",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border border-slate-200 shadow-none rounded-xl p-6 bg-white group hover:border-slate-300 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-500 group-hover:scale-110",
                  stat.color === "amber" &&
                    "bg-amber-50 text-amber-500 border-amber-100",
                  stat.color === "blue" &&
                    "bg-blue-50 text-blue-500 border-blue-100",
                  stat.color === "purple" &&
                    "bg-purple-50 text-purple-500 border-purple-100",
                  stat.color === "emerald" &&
                    "bg-emerald-50 text-emerald-500 border-emerald-100",
                )}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Fulfillment Queue
          </h3>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-900 text-white border-none rounded-md px-2 py-0.5 text-[9px] font-black uppercase">
              {filteredOrders.length} Total
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-50 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-8 py-4">
                Reference
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Client
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Settlement
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                Lifecycle
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-8">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-40 text-center"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary inline-block" />
                </TableCell>
              </TableRow>
            ) : currentOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-40 text-center text-slate-400 font-bold uppercase text-[10px]"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              currentOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-slate-50 hover:bg-slate-50/30 cursor-pointer group transition-all"
                  onClick={() =>
                    router.push(
                      `/core/transaction2/seller/orders/${order.id}`,
                    )
                  }
                >
                  <TableCell className="pl-8 py-6">
                    <p className="font-black text-slate-900 text-sm">
                      {[
                        "to_pay",
                        "to_ship",
                      ].includes(order.status)
                        ? order.order_number ||
                          `#${order.id.slice(0, 8)}`
                        : order.tracking_number ||
                          `TRK-${order.id.slice(0, 8)}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {new Date(
                        order.created_at,
                      ).toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">
                        {order.customer
                          ?.full_name || "Guest"}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 leading-none">
                        {order.customer?.email ||
                          "No Email"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
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
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                      {order.payment_method ||
                        "COD"}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 border shadow-none rounded-md",
                        getStatusColor(
                          order.status,
                        ),
                      )}
                      variant="outline"
                    >
                      {["delivered", "completed"].includes(order.status) ? "delivered" : order.status.replace(
                        "_",
                        " ",
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      {["delivered", "completed", "cancelled"].includes(
                        order.status,
                      ) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(order.id);
                          }}
                          title="Archive Order"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={cn(
                    "h-8 w-8 p-0 text-[10px] font-black rounded-md border-none transition-all",
                    currentPage === page
                      ? "bg-slate-900 text-white"
                      : "bg-transparent text-slate-400 hover:bg-slate-100",
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
