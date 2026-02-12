"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Mail,
  CheckCircle2,
  Truck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSellerOrder,
  updateSellerOrderStatus,
} from "@/app/actions/seller";
import { useUser } from "@/context/UserContext";

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
        <p className="text-slate-500 font-bold">
          Order not found
        </p>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const { customer, items } = order;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                Order #{order.id.slice(0, 8)}
              </h1>
              <Badge
                className={`
                                ${order.status === "to_pay" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : ""}
                                ${order.status === "to_ship" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : ""}
                                ${order.status === "to_receive" ? "bg-purple-100 text-purple-700 hover:bg-purple-100" : ""}
                                ${order.status === "completed" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                                text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg
                            `}
              >
                {order.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-slate-500 font-bold text-xs mt-1">
              Placed on{" "}
              {new Date(
                order.created_at,
              ).toLocaleDateString()}{" "}
              at{" "}
              {new Date(
                order.created_at,
              ).toLocaleTimeString()}
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
              className="bg-primary text-black font-black px-6 rounded-xl h-11 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
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
              className="bg-purple-600 text-white font-black px-6 rounded-xl h-11 hover:bg-purple-700 shadow-lg shadow-purple-600/20 hover:scale-105 transition-transform"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ship Order"
              )}
            </Button>
          )}
          {order.status === "to_receive" && (
            // Usually customer confirms receipt, but maybe "Mark Delivered" for courier integration
            <Button
              disabled
              variant="outline"
              className="font-bold px-6 rounded-xl h-11 border-slate-200 text-slate-400"
            >
              Awaiting Customer Receipt
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order Items
              </CardTitle>
            </CardHeader>
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase text-slate-400 pl-6">
                      Product
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">
                      Qty
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-right pr-6">
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
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
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
                                <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-xs">
                                  IMG
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm line-clamp-2">
                                {item.product
                                  ?.name ||
                                  item.product_name}
                              </p>
                              <p className="text-xs text-primary font-bold mt-1">
                                {(
                                  item.price_at_purchase ||
                                  0
                                ).toLocaleString(
                                  "en-PH",
                                  {
                                    style:
                                      "currency",
                                    currency:
                                      "PHP",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-600">
                          x{item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-black text-slate-900 pr-6">
                          {(
                            (item.price_at_purchase ||
                              0) * item.quantity
                          ).toLocaleString(
                            "en-PH",
                            {
                              style: "currency",
                              currency: "PHP",
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

          <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">
                  Subtotal
                </span>
                <span className="font-bold text-slate-900">
                  {(
                    order.total_amount -
                    (order.shipping_fee || 0)
                  ).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">
                  Shipping Fee
                </span>
                <span className="font-bold text-slate-900">
                  {(
                    order.shipping_fee || 0
                  ).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </span>
              </div>
              <Separator className="bg-slate-100" />
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 text-lg">
                  Total Amount
                </span>
                <span className="font-black text-primary text-2xl">
                  {order.total_amount.toLocaleString(
                    "en-PH",
                    {
                      style: "currency",
                      currency: "PHP",
                    },
                  )}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Customer & Delivery Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-wide text-slate-500">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                  {customer?.full_name?.[0] ||
                    "U"}
                </div>
                <div>
                  <p className="font-black text-slate-900">
                    {customer?.full_name ||
                      "Guest User"}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    Customer ID:{" "}
                    {order.customer_id.slice(
                      0,
                      8,
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600">
                    {customer?.email ||
                      "No email provided"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-wide text-slate-500">
                <MapPin className="h-4 w-4" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Shipping Address
                </p>
                <p className="font-bold text-slate-800 text-sm leading-relaxed">
                  {order.shipping_address ||
                    "No address provided"}
                </p>
              </div>
              <Separator className="bg-slate-100" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Payment Method
                </p>
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="uppercase">
                    {order.payment_method ||
                      "COD"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`ml-auto ${order.payment_status === "paid" ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}
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
