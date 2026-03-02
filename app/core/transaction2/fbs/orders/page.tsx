"use client";

import { useUser } from "@/context/UserContext";
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
  Truck,
  Clock,
  CheckCircle2,
  Warehouse,
  FileText,
  XCircle,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function FBSOrdersPage() {
  const { shop, sellerOrders } = useUser();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "orders" | "purchase-orders"
  >("orders");
  const [currentPage, setCurrentPage] =
    useState(1);
  const itemsPerPage = 6;

  // --- Purchase Orders state ---
  const [pos, setPOs] = useState<any[]>([]);
  const [poLoading, setPOLoading] =
    useState(true);
  const [poSearch, setPOSearch] = useState("");

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
        .includes(search.toLowerCase()) ||
      o.customer?.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(
    filtered.length / itemsPerPage,
  );
  const currentOrders = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "to_pay":
        return "bg-amber-50 text-amber-500 border-amber-100";
      case "to_ship":
        return "bg-blue-50 text-blue-500 border-blue-100";
      case "in_transit":
      case "to_receive":
        return "bg-purple-50 text-purple-500 border-purple-100";
      case "delivered":
        return "bg-teal-50 text-teal-500 border-teal-100";
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

  const stats = {
    to_pay: orders.filter(
      (o: any) => o.status === "to_pay",
    ).length,
    to_ship: orders.filter(
      (o: any) => o.status === "to_ship",
    ).length,
    to_receive: orders.filter(
      (o: any) => o.status === "to_receive",
    ).length,
    completed: orders.filter(
      (o: any) => o.status === "completed",
    ).length,
    cancelled: orders.filter(
      (o: any) =>
        o.status === "cancelled" ||
        o.status === "cancel_pending",
    ).length,
  };

  // --- Purchase Orders logic ---
  const fetchPOs = useCallback(async () => {
    if (!shop?.name) return;
    setPOLoading(true);

    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .select("*, products (name, barcode)")
      .eq("supplier_name", shop.name)
      .order("id", { ascending: false });

    if (!error && data) setPOs(data);
    setPOLoading(false);
  }, [shop]);

  useEffect(() => {
    if (activeTab === "purchase-orders") {
      fetchPOs();
    }
  }, [activeTab, fetchPOs]);

  const handleAcceptPO = async (po: any) => {
    const toastId = toast.loading(
      "Accepting PO and preparing shipment...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "approved" })
      .eq("id", po.id);

    if (error) {
      toast.error("Failed to accept PO", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success("PO Accepted!", {
        id: toastId,
        description:
          "Ship the requested quantity to the warehouse. Stock will update on receipt.",
      });
      fetchPOs();
    }
  };

  const handleDeclinePO = async (po: any) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "rejected" })
      .eq("id", po.id);

    if (!error) {
      toast.info("PO declined");
      fetchPOs();
    }
  };

  const filteredPOs = pos.filter(
    (p) =>
      p.products?.name
        ?.toLowerCase()
        .includes(poSearch.toLowerCase()) ||
      p.status
        ?.toLowerCase()
        .includes(poSearch.toLowerCase()),
  );

  const pendingCount = pos.filter(
    (p) => p.status === "requested",
  ).length;
  const acceptedCount = pos.filter(
    (p) => p.status === "approved",
  ).length;

  return (
    <div className="space-y-9">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Manage Orders
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Warehouse-fulfilled orders & purchase
            order management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-medium focus-visible:ring-primary"
              placeholder="Search orders..."
              value={
                activeTab === "orders"
                  ? search
                  : poSearch
              }
              onChange={(e) => {
                if (activeTab === "orders") {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                } else {
                  setPOSearch(e.target.value);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("orders")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "orders"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          Orders
        </button>
        <button
          onClick={() =>
            setActiveTab("purchase-orders")
          }
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === "purchase-orders"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Purchase Orders
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ====== ORDERS TAB ====== */}
      {activeTab === "orders" && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
                    {stats.to_pay}
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
            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Cancelled
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {stats.cancelled}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                All Orders
                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">
                  <Warehouse className="h-3 w-3" />
                  Warehouse
                </span>
              </CardTitle>
            </CardHeader>
            <div className="mt-4 overflow-x-auto">
              {orders.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No orders found.
                  </p>
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
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Fulfilled By
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrders.map(
                      (order: any) => (
                        <TableRow
                          key={order.id}
                          className="border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        >
                          <TableCell className="font-bold py-4">
                            {order.order_number ||
                              "#" +
                                order.id.slice(
                                  0,
                                  8,
                                )}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {order.customer
                              ?.full_name ||
                              "Guest"}
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
                          <TableCell>
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded w-fit">
                              <Warehouse className="h-2.5 w-2.5" />
                              Warehouse
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors inline-block" />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {filtered.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Showing{" "}
                  {(currentPage - 1) *
                    itemsPerPage +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filtered.length,
                  )}{" "}
                  of {filtered.length} entries
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
        </>
      )}

      {/* ====== PURCHASE ORDERS TAB ====== */}
      {activeTab === "purchase-orders" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Pending POs
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {poLoading
                      ? "..."
                      : pendingCount}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    Awaiting your confirmation
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Accepted — Ship Now
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {poLoading
                      ? "..."
                      : acceptedCount}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    Ready to ship to warehouse
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black">
                All Purchase Orders
              </CardTitle>
            </CardHeader>
            <div className="mt-4 overflow-x-auto">
              {poLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPOs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        PO #
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Product
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Qty Required
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Status
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPOs.map((po) => (
                      <TableRow
                        key={po.id}
                        className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-bold text-slate-900 py-4">
                          #PO-
                          {po.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-black text-sm text-slate-900">
                              {po.products
                                ?.name ||
                                "Unknown"}
                            </p>
                            {po.products
                              ?.barcode && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {
                                  po.products
                                    .barcode
                                }
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-slate-900">
                          {po.quantity} units
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black uppercase border",
                              po.status ===
                                "approved"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : po.status ===
                                    "received"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : po.status ===
                                      "rejected"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100",
                            )}
                          >
                            {po.status ===
                            "requested"
                              ? "Pending"
                              : po.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {po.status ===
                            "requested" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeclinePO(
                                    po,
                                  )
                                }
                                className="h-9 rounded-lg text-red-500 font-bold text-xs hover:bg-red-50"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAcceptPO(
                                    po,
                                  )
                                }
                                className="h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Accept & Ship
                              </Button>
                            </div>
                          )}
                          {po.status ===
                            "approved" && (
                            <span className="text-[10px] font-black text-blue-500 uppercase">
                              Ship to warehouse →
                            </span>
                          )}
                          {po.status ===
                            "received" && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No purchase orders
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
