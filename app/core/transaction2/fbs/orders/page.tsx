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
  ChevronRight,
  Package2,
  ShoppingCart,
  Users,
  CreditCard,
  Activity,
  Archive,
} from "lucide-react";
import Link from "next/link";
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
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { archiveOrder } from "@/app/actions/orders";

const supabase = createClient();

export default function FBSOrdersPage() {
  const {
    shop,
    sellerOrders,
    refreshSellerOrders,
  } = useUser();
  const router = useRouter();
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

  const handleArchive = async (id: string) => {
    const toastId = toast.loading(
      "Archiving order...",
    );
    try {
      const res = await archiveOrder(id);
      if (res.success) {
        toast.success("Order archived", {
          id: toastId,
        });
        refreshSellerOrders();
      } else {
        toast.error(
          res.error || "Failed to archive",
          { id: toastId },
        );
      }
    } catch (error) {
      toast.error("An error occurred", {
        id: toastId,
      });
    }
  };

  const filtered = orders.filter(
    (o: any) =>
      o.status !== "archived" &&
      (o.order_number
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
        o.status
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        o.customer?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase())),
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
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "to_ship":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "in_transit":
      case "to_receive":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "delivered":
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
      maximumFractionDigits: 0,
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
    total: orders.length,
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
      (o: any) => o.status === "delivered",
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

  const pendingPOCount = pos.filter(
    (p) => p.status === "requested",
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        <Link
          href="/core/transaction2/fbs"
          className="hover:text-primary transition-colors"
        >
          DASHBOARD
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          MANAGE ORDERS
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Manage Orders
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            Warehouse-fulfilled orders &
            procurement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-11 rounded-lg bg-white border border-slate-200 shadow-none font-medium focus-visible:ring-primary focus-visible:border-primary transition-all"
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
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl w-fit border border-slate-100">
        <button
          onClick={() => setActiveTab("orders")}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "orders"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          Customer Orders
        </button>
        <button
          onClick={() =>
            setActiveTab("purchase-orders")
          }
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === "purchase-orders"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Purchase Orders
          {pendingPOCount > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
              {pendingPOCount}
            </span>
          )}
        </button>
      </div>

      {/* ====== ORDERS TAB ====== */}
      {activeTab === "orders" && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Awaiting Payment",
                value: stats.to_pay,
                icon: Clock,
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
              {
                label: "Pending Release",
                value: stats.to_ship,
                icon: Package,
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                label: "In Fulfillment",
                value: stats.to_receive,
                icon: Truck,
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: CheckCircle2,
                color: "text-emerald-500",
                bg: "bg-emerald-50",
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
                      stat.bg,
                      stat.color,
                      stat.color ===
                        "text-amber-500" &&
                        "border-amber-100",
                      stat.color ===
                        "text-blue-500" &&
                        "border-blue-100",
                      stat.color ===
                        "text-purple-500" &&
                        "border-purple-100",
                      stat.color ===
                        "text-emerald-500" &&
                        "border-emerald-100",
                    )}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Orders Table */}
          <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                Order Management
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-none flex items-center gap-1"
                >
                  <Warehouse className="h-3 w-3" />
                  Warehouse
                </Badge>
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
                        Reference Number
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Customer
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Order Date
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Order Value
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Fulfillment Status
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
                          onClick={() =>
                            router.push(
                              `/core/transaction2/fbs/orders/${order.id}`,
                            )
                          }
                          className="border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        >
                          <TableCell className="font-bold py-5">
                            {[
                              "to_pay",
                              "to_ship",
                            ].includes(
                              order.status,
                            ) ? (
                              <span className="text-slate-900 tracking-tight">
                                Order #
                                {order.order_number ||
                                  order.id.slice(
                                    0,
                                    8,
                                  )}
                              </span>
                            ) : (
                              <span className="text-primary tracking-tight">
                                Track #
                                {order.tracking_number ||
                                  "TRK-" +
                                    order.id
                                      .slice(0, 8)
                                      .toUpperCase()}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {order.customer
                              ?.full_name ||
                              "Guest"}
                          </TableCell>
                          <TableCell className="text-slate-500 font-bold text-xs uppercase">
                            {formatDate(
                              order.created_at,
                            )}
                          </TableCell>
                          <TableCell className="font-black text-slate-900">
                            {formatCurrency(
                              order.total_amount,
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "px-3 py-1 text-[10px] font-black uppercase rounded-lg border",
                                getStatusColor(
                                  order.status,
                                ),
                              )}
                            >
                              {order.status === "delivered" ? "delivered" : order.status.replace(
                                "_",
                                " ",
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {[
                                "delivered",
                                "cancelled",
                              ].includes(
                                order.status,
                              ) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                  onClick={(
                                    e,
                                  ) => {
                                    e.stopPropagation();
                                    handleArchive(
                                      order.id,
                                    );
                                  }}
                                  title="Archive Order"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg group-hover:bg-primary group-hover:text-black transition-all"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
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
                  of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  {Array.from(
                    { length: totalPages },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <Button
                      key={page}
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage(page);
                      }}
                      className={cn(
                        "h-9 w-9 rounded-lg font-black text-xs border border-slate-200 shadow-none transition-all",
                        currentPage === page
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-transparent text-slate-400 hover:text-slate-900 hover:border-slate-300",
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
            <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Pending Requests
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    {poLoading
                      ? "..."
                      : pendingPOCount}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Awaiting confirmation
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 shadow-sm">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Accepted Shipments
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    {poLoading
                      ? "..."
                      : pos.filter(
                          (p) =>
                            p.status ===
                            "approved",
                        ).length}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Ready for warehouse delivery
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black">
                Procurement Pipeline
              </CardTitle>
            </CardHeader>
            <div className="mt-4 overflow-x-auto">
              {poLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPOs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        PO ID
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Product
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Inbound Qty
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Pipeline Status
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
                        <TableCell className="font-black text-slate-900 py-5">
                          #PO-
                          {po.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-sm text-slate-900">
                              {po.products
                                ?.name ||
                                "Unknown"}
                            </p>
                            {po.products
                              ?.barcode && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                BARCODE:{" "}
                                {
                                  po.products
                                    .barcode
                                }
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-slate-900">
                          {po.quantity} UNITS
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
                              ? "Pending Approval"
                              : po.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {po.status ===
                            "requested" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDeclinePO(
                                    po,
                                  )
                                }
                                className="h-9 rounded-lg text-red-600 bg-red-50/50 border-red-100 font-black text-[10px] uppercase tracking-widest px-4 hover:bg-red-100 hover:text-red-700 transition-all shadow-none"
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAcceptPO(
                                    po,
                                  )
                                }
                                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest px-6 transition-all shadow-none border-none"
                              >
                                Accept & Ship
                              </Button>
                            </div>
                          )}
                          {po.status ===
                            "approved" && (
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center justify-end gap-2">
                              <Truck className="h-3 w-3" />
                              Ship to Warehouse
                            </span>
                          )}
                          {po.status ===
                            "received" && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-none flex items-center gap-1 ml-auto w-fit"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Inventory Received
                            </Badge>
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
                    No procurement records
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
