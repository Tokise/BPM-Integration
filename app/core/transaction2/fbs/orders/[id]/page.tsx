"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronRight,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Mail,
  CheckCircle2,
  Truck,
  Loader2,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSellerOrder,
  updateSellerOrderStatus,
} from "@/app/actions/seller";
import { useUser } from "@/context/UserContext";

export default function FBSOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { refreshSellerOrders } = useUser();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async (
    showMainLoader = true,
  ) => {
    if (showMainLoader) setLoading(true);
    const result = await getSellerOrder(orderId);

    if (!result.success || !result.data) {
      console.error(
        "Error fetching order:",
        result.error,
      );
      toast.error(
        "Failed to load order details: " +
          (result.error || "Unknown error"),
      );
    } else {
      setOrder(result.data);
    }
    if (showMainLoader) setLoading(false);
  };

  const handleUpdateStatus = async (
    newStatus: string,
  ) => {
    setUpdating(true);

    const result = await updateSellerOrderStatus(
      orderId,
      newStatus,
    );

    if (!result.success) {
      toast.error(
        "Status Update Failed: " +
          (result.error || "Unknown error"),
      );
    } else {
      toast.success(
        `Order status updated to ${newStatus.replace("_", " ")}`,
      );
      // Refresh data globally and locally
      await Promise.all([
        refreshSellerOrders(),
        fetchOrderDetails(false),
      ]);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
          Order not found
        </p>
        <Button
          onClick={() => router.back()}
          className="rounded-lg font-black uppercase text-[10px] tracking-widest px-8"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const { customer, items } = order;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
        <Link
          href="/core/transaction2/fbs"
          className="hover:text-primary transition-colors"
        >
          DASHBOARD
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <Link
          href="/core/transaction2/fbs/orders"
          className="hover:text-primary transition-colors"
        >
          MANAGE ORDERS
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          ORDER DETAILS
        </span>
      </div>

      {/* Transit Progress (NEW) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Order Placed",
            status: "to_pay",
            icon: Calendar,
            active: true,
          },
          {
            label: "Processing",
            status: "to_ship",
            icon: Package,
            active: [
              "to_ship",
              "to_receive",
              "in_transit",
              "shipped",
              "delivered",
            ].includes(order.status?.toLowerCase()) || [
              "in_transit",
              "shipped",
            ].includes(order.shipping_status?.toLowerCase()),
          },
          {
            label: "In Transit",
            status: "to_receive",
            icon: Truck,
            active: [
              "to_receive",
              "in_transit",
              "shipped",
              "delivered",
            ].includes(order.status?.toLowerCase()) || [
              "in_transit",
              "shipped",
            ].includes(order.shipping_status?.toLowerCase()),
          },
          {
            label: "Delivered",
            status: "delivered",
            icon: CheckCircle2,
            active: [
              "delivered",
            ].includes(order.status),
          },
        ].map((step, i) => (
          <Card
            key={i}
            className={cn(
              "p-4 border-none shadow-none rounded-xl transition-all",
              step.active
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-300",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  step.active
                    ? "bg-white/10"
                    : "bg-slate-100",
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-[9px] font-bold",
                    step.active
                      ? "text-slate-400"
                      : "text-slate-200",
                  )}
                >
                  {step.active
                    ? "COMPLETED"
                    : "PENDING"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                {["to_pay", "to_ship"].includes(
                  order.status,
                )
                  ? "Order"
                  : "Tracking"}{" "}
                #
                {["to_pay", "to_ship"].includes(
                  order.status,
                )
                  ? order.order_number ||
                    order.id.slice(0, 8)
                  : order.tracking_number ||
                    `FBS-TRK-${order.id.slice(0, 8)}`}
              </h1>
              <Badge
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 border shadow-none rounded-lg",
                  order.status === "to_pay" &&
                    "bg-amber-50 text-amber-600 border-amber-100",
                  order.status === "to_ship" &&
                    "bg-blue-50 text-blue-600 border-blue-100",
                  order.status === "to_receive" &&
                    "bg-purple-50 text-purple-600 border-purple-100",
                  ["delivered", "completed"].includes(order.status) &&
                    "bg-emerald-50 text-emerald-600 border-emerald-100",
                  order.status === "cancelled" &&
                    "bg-red-50 text-red-600 border-red-100",
                )}
                variant="outline"
              >
                {["delivered", "completed"].includes(order.status) ? "delivered" : order.status.replace(
                  "_",
                  " ",
                )}
              </Badge>
              <Badge
                className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center gap-1"
                variant="outline"
              >
                <Warehouse className="h-3 w-3" />
                Warehouse
              </Badge>
            </div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              Placed on{" "}
              {order.created_at &&
              !isNaN(
                new Date(
                  order.created_at,
                ).getTime(),
              ) ? (
                <>
                  {new Date(
                    order.created_at,
                  ).toLocaleDateString()}{" "}
                  at{" "}
                  {new Date(
                    order.created_at,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : (
                "Recently"
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {order.status === "to_pay" && (
            <Button
              onClick={() =>
                handleUpdateStatus("to_ship")
              }
              disabled={updating}
              className="bg-primary hover:bg-primary/90 text-slate-900 font-black px-8 rounded-lg h-12 transition-all border-none text-[10px] uppercase tracking-widest shadow-none"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Payment"
              )}
            </Button>
          )}
          {order.status === "to_ship" && (
            <Button
              onClick={() =>
                handleUpdateStatus("to_receive")
              }
              disabled={updating}
              className="bg-slate-900 text-white font-black px-8 rounded-lg h-12 hover:bg-black transition-all border-none text-[10px] uppercase tracking-widest shadow-none"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Acknowledge & Release"
              )}
            </Button>
          )}
          {order.status === "to_receive" && (
            <Badge
              variant="outline"
              className="h-12 px-6 rounded-lg border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest"
            >
              Warehouse Fulfillment In Progress
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Package className="h-5 w-5 mt-8 text-amber-500" />
                <p className="mt-8">
                  Warehouse Inventory Items
                </p>
              </CardTitle>
            </CardHeader>
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 pl-6 tracking-widest">
                      Product Details
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 text-center tracking-widest">
                      Quantity
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 text-right pr-6 tracking-widest">
                      Price
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map(
                    (item: any, idx: number) => (
                      <TableRow
                        key={idx}
                        className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="pl-6 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                              {item.product
                                ?.images?.[0] ? (
                                <img
                                  src={
                                    item.product
                                      .images[0]
                                  }
                                  alt={
                                    item.product
                                      .name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-[10px]">
                                  NO IMG
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm line-clamp-1">
                                {item.product
                                  ?.name ||
                                  item.product_name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                SKU: FBS-
                                {item.product?.id?.slice(
                                  0,
                                  8,
                                ) ||
                                  item.id.slice(
                                    0,
                                    8,
                                  )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-black text-slate-900 align-middle">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-black text-slate-900 pr-6 align-middle">
                          {(
                            (item.price_at_purchase ||
                              0) * item.quantity
                          ).toLocaleString(
                            "en-PH",
                            {
                              style: "currency",
                              currency: "PHP",
                              maximumFractionDigits: 0,
                            },
                          )}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">
                  Order Subtotal
                </span>
                <span className="font-black text-slate-900">
                  {(
                    order.total_amount -
                    (order.shipping_fee || 0)
                  ).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">
                  Logistics Fee
                </span>
                <span className="font-black text-slate-900">
                  {(
                    order.shipping_fee || 0
                  ).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <Separator className="bg-slate-100" />
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 text-sm uppercase tracking-widest">
                  Total Settlement
                </span>
                <span className="font-black text-amber-600 text-2xl tracking-tighter">
                  {order.total_amount.toLocaleString(
                    "en-PH",
                    {
                      style: "currency",
                      currency: "PHP",
                      maximumFractionDigits: 0,
                    },
                  )}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Customer & Delivery Info */}
        <div className="space-y-6">
          {/* Warehouse Performance Notification */}
          <Card className="border border-blue-100 shadow-none rounded-lg bg-blue-50/30 p-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              FBS Note
            </h3>
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              This order is fulfilled by our
              automated warehouse system. Status
              updates are synced in real-time with
              the fulfillment center.
            </p>
          </Card>

          {/* Customer Info */}
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <User className="h-4 w-4 mt-8" />
                <p className="mt-8">Customer</p>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                  {customer?.full_name?.[0] ||
                    "U"}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-black text-slate-900 text-sm line-clamp-1 leading-tight">
                    {customer?.full_name ||
                      "Guest User"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    ID:{" "}
                    {order.customer_id.slice(
                      0,
                      10,
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm pt-4 border-t border-slate-50">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold text-slate-600 text-xs truncate">
                  {customer?.email ||
                    "No email provided"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <MapPin className="h-4 w-4 mt-8" />
                <p className="mt-8">
                  Destination
                </p>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Shipping Address
                </p>
                <p className="font-bold text-slate-800 text-xs leading-relaxed">
                  {order.shipping_address ||
                    "No address provided"}
                </p>
              </div>
              <Separator className="bg-slate-50" />
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Payment Method
                </p>
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                  <span className="uppercase text-xs tracking-tighter">
                    {order.payment_method ||
                      "COD"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-[9px] font-black h-5 ${order.payment_status === "paid" ? "text-emerald-600 bg-emerald-50 border-emerald-200 shadow-none" : "text-amber-600 bg-amber-50 border-amber-200 shadow-none"}`}
                  >
                    {order.payment_status ===
                    "paid"
                      ? "PAID"
                      : "PENDING"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
