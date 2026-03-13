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
  Package2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSellerOrder,
  updateSellerOrderStatus,
} from "@/app/actions/seller";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

export default function SellerOrderDetailPage() {
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
      toast.error("Failed to load order details");
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
          href="/core/transaction2/seller"
          className="hover:text-primary transition-colors"
        >
          DASHBOARD
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <Link
          href="/core/transaction2/seller/orders"
          className="hover:text-primary transition-colors"
        >
          ORDER MANAGEMENT
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          ORDER DETAILS
        </span>
      </div>

      {/* Transit Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Order Received",
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
              "delivered",
              "completed",
            ].includes(order.status),
          },
          {
            label: "Shipped Out",
            status: "to_receive",
            icon: Truck,
            active: [
              "to_receive",
              "delivered",
              "completed",
            ].includes(order.status),
          },
          {
            label: "Delivered",
            status: "delivered",
            icon: CheckCircle2,
            active: [
              "delivered",
              "completed",
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
                    ? "STAGED"
                    : "AWAITING"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
                  `TRK-${order.id.slice(0, 8)}`}
            </h1>
            <Badge
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border",
                order.status === "to_pay"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : order.status === "to_ship"
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : order.status ===
                        "to_receive"
                      ? "bg-purple-50 text-purple-600 border-purple-100"
                      : order.status ===
                          "delivered"
                        ? "bg-teal-50 text-teal-600 border-teal-100"
                        : order.status ===
                            "completed"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-50 text-slate-600 border-slate-100",
              )}
              variant="outline"
            >
              {order.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            Registered on{" "}
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
          </p>
        </div>

        <div className="flex gap-3">
          {order.status === "to_pay" && (
            <Button
              onClick={() =>
                handleUpdateStatus("to_ship")
              }
              disabled={updating}
              className="h-12 bg-primary hover:bg-primary/90 text-slate-900 font-black px-8 rounded-lg text-[10px] uppercase tracking-widest"
            >
              Confirm Payment
            </Button>
          )}
          {order.status === "to_ship" && (
            <Button
              onClick={() =>
                handleUpdateStatus("to_receive")
              }
              disabled={updating}
              className="h-12 bg-slate-900 text-white font-black px-8 rounded-lg text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200"
            >
              Ship Order Now
            </Button>
          )}
          {order.status === "to_receive" && (
            <Button
              onClick={() =>
                handleUpdateStatus("delivered")
              }
              disabled={updating}
              className="h-12 bg-teal-600 hover:bg-teal-700 text-white font-black px-8 rounded-lg text-[10px] uppercase tracking-widest shadow-xl shadow-teal-100"
            >
              Mark as Delivered
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <Package2 className="h-4 w-4 mt-8" />
                <p className="mt-8">
                  Order Composition
                </p>
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-50 bg-slate-50/30">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">
                    Item
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
                    Qty
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map(
                  (item: any, idx: number) => (
                    <TableRow
                      key={idx}
                      className="border-slate-50 hover:bg-slate-50/50"
                    >
                      <TableCell className="pl-6 py-4 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                            {item.product
                              ?.images?.[0] ? (
                              <img
                                src={
                                  item.product
                                    .images[0]
                                }
                                alt=""
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
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {
                                item.product_category
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-slate-900 align-middle">
                        x{item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900 pr-6 align-middle">
                        {(
                          item.price_at_purchase *
                          item.quantity
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
          </Card>

          <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Subtotal
              </span>
              <span className="font-bold text-slate-900">
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
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Logistics Fee
              </span>
              <span className="font-bold text-slate-900">
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
              <span className="text-sm font-black uppercase text-slate-900 tracking-widest">
                Total Settlement
              </span>
              <span className="text-2xl font-black text-primary tracking-tighter">
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
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <User className="h-5 w-4" />{" "}
                Customer Insight
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
                  {customer?.email || "No email"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <MapPin className="h-4 w-4" />{" "}
                Dispatch Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Consumer Address
                </p>
                <p className="font-bold text-slate-800 text-xs leading-relaxed">
                  {order.shipping_address ||
                    "No address provided"}
                </p>
              </div>
              <Separator className="bg-slate-50" />
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Payment Strategy
                </p>
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span className="uppercase text-xs tracking-tighter">
                    {order.payment_method ||
                      "COD"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-auto text-[9px] font-black h-5 shadow-none",
                      order.payment_status ===
                        "paid"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : "text-amber-600 bg-amber-50 border-amber-200",
                    )}
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
