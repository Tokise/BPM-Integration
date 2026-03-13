"use client";
import {
  useEffect,
  useState,
  Suspense,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  Store,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const supabase = createClient();

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] =
    useState(searchParams.get("number") || "");
  const [orderData, setOrderData] =
    useState<any>(null);
  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    const number = searchParams.get("number");
    if (number) {
      setTrackingNumber(number);
      fetchOrderDetails(number);
    }
  }, [searchParams]);

  const fetchOrderDetails = async (
    number: string,
  ) => {
    if (!number) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
                    *,
                    shops(name),
                    order_items(
                        id,
                        product_name,
                        product_image,
                        product_category,
                        quantity,
                        price_at_purchase
                    )
                `,
        )
        .eq("order_number", number)
        .single();

      if (data) {
        setOrderData(data);
      } else {
        setOrderData(null);
      }
    } catch (error) {
      console.error(
        "Error fetching order:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = () => {
    fetchOrderDetails(trackingNumber);
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 space-y-8">
      <Button
        variant="ghost"
        onClick={() =>
          router.push(
            "/core/transaction1/purchases",
          )
        }
        className="gap-2 hover:bg-slate-50 rounded-lg -ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400 p-0 h-auto"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Purchases
      </Button>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
          Track Your Order
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          Enter your tracking number to see the
          status of your package.
        </p>

        <div className="max-w-md mx-auto flex gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={trackingNumber}
              onChange={(e) =>
                setTrackingNumber(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && handleTrack()
              }
              placeholder="Tracking Number (e.g. ORD-...)"
              className="h-12 pl-10 rounded-lg border border-slate-200 focus:ring-0 shadow-none transition-all"
            />
          </div>
          <Button
            onClick={handleTrack}
            disabled={isLoading}
            className="h-12 px-6 rounded-lg bg-slate-900 text-white font-black hover:bg-black transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Track
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bold text-xs uppercase tracking-[0.2em]">
            Searching for Order...
          </p>
        </div>
      ) : orderData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Delivery Info & Progress */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
                <div className="p-6 md:p-8 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                        Estimate Delivery
                      </p>
                      <h2 className="text-xl font-black text-slate-900">
                        {orderData.created_at ? (
                          <>
                            {new Date(
                              new Date(
                                orderData.created_at,
                              ).getTime() +
                                3 *
                                  24 *
                                  60 *
                                  60 *
                                  1000,
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            • 9AM - 5PM
                          </>
                        ) : (
                          "Pending"
                        )}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 p-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Truck className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-900 leading-tight">
                          Carrier: Logistics
                          Express
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">
                          Standard Delivery
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
                    <div
                      className={`absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000`}
                      style={{
                        width:
                          orderData.status ===
                          "to_pay"
                            ? "0%"
                            : orderData.status ===
                                "to_ship"
                              ? "33.33%"
                              : [
                                    "in_transit",
                                    "to_receive",
                                  ].includes(
                                    orderData.status,
                                  )
                                ? "66.66%"
                                : orderData.status ===
                                    "completed"
                                  ? "100%"
                                  : "0%",
                      }}
                    />

                    <div className="relative flex justify-between">
                      {[
                        {
                          label: "Confirmed",
                          icon: CheckCircle2,
                          status: [
                            "to_ship",
                            "in_transit",
                            "to_receive",
                            "completed",
                          ],
                        },
                        {
                          label: "Picked Up",
                          icon: Package,
                          status: [
                            "in_transit",
                            "to_receive",
                            "completed",
                          ],
                        },
                        {
                          label: "In Transit",
                          icon: Truck,
                          status: [
                            "in_transit",
                            "to_receive",
                            "completed",
                          ],
                        },
                        {
                          label: "Delivered",
                          icon: CheckCircle2,
                          status: ["completed"],
                        },
                      ].map((step, i) => {
                        const isDone =
                          step.status.includes(
                            orderData.status,
                          );
                        const isActive =
                          (i === 0 &&
                            orderData.status ===
                              "to_ship") ||
                          (i === 1 &&
                            orderData.status ===
                              "in_transit") ||
                          (i === 2 &&
                            orderData.status ===
                              "to_receive") ||
                          (i === 3 &&
                            orderData.status ===
                              "completed");

                        return (
                          <div
                            key={i}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center z-10 transition-all ${
                                isActive
                                  ? "bg-primary text-black scale-110 shadow-md"
                                  : isDone
                                    ? "bg-slate-900 text-white"
                                    : "bg-white text-slate-300 border-2 border-slate-100"
                              }`}
                            >
                              <step.icon className="h-4 w-4" />
                            </div>
                            <span
                              className={`text-[8px] font-black uppercase tracking-widest ${isDone || isActive ? "text-slate-900" : "text-slate-400"}`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Order Details Grid */}
              <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      {[
                        "to_pay",
                        "to_ship",
                      ].includes(
                        orderData.status,
                      ) ? (
                        <span>
                          Order #
                          {orderData.order_number ||
                            orderData.id.slice(
                              0,
                              8,
                            )}
                        </span>
                      ) : (
                        <span>
                          Tracking #
                          {orderData.tracking_number ||
                            "TRK-" +
                              orderData.id
                                .slice(0, 8)
                                .toUpperCase()}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Store className="h-3 w-3 text-amber-500" />
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        {orderData.shops?.name ||
                          "Store"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orderData.order_items?.map(
                      (item: any) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-lg flex gap-3 items-center group border border-slate-200 hover:bg-slate-50 transition-all shadow-none"
                        >
                          <div className="h-14 w-14 bg-white rounded-lg overflow-hidden shadow-none border border-slate-100 flex-shrink-0">
                            {item.product_image ? (
                              <img
                                src={
                                  item.product_image
                                }
                                alt={
                                  item.product_name
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 text-[11px] truncate leading-tight">
                              {item.product_name}
                            </h4>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                              {
                                item.product_category
                              }
                            </p>
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-bold text-slate-500">
                                Qty:{" "}
                                {item.quantity}
                              </p>
                              <p className="text-sm font-black text-slate-900">
                                {item.price_at_purchase.toLocaleString(
                                  "en-PH",
                                  {
                                    style:
                                      "currency",
                                    currency:
                                      "PHP",
                                    maximumFractionDigits: 0,
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      Total Amount
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {orderData.total_amount.toLocaleString(
                        "en-PH",
                        {
                          style: "currency",
                          currency: "PHP",
                          maximumFractionDigits: 0,
                        },
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Tracking History */}
            <div className="lg:col-span-1">
              <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white h-full">
                <div className="p-6 md:p-8 space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    Tracking History
                  </h3>
                  <div className="space-y-6">                    {(() => {
                      const baseDate = new Date(orderData.created_at || Date.now());
                      
                      const formatStatusDate = (daysAdd: number, hoursAdd: number) => {
                        const date = new Date(baseDate.getTime() + (daysAdd * 24 + hoursAdd) * 60 * 60 * 1000);
                        const today = new Date();
                        const isToday = date.getDate() === today.getDate() && 
                                        date.getMonth() === today.getMonth() && 
                                        date.getFullYear() === today.getFullYear();
                        
                        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        if (isToday) return `TODAY, ${timeStr}`;
                        return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + `, ${timeStr}`;
                      };

                      const allSteps = [
                        {
                          id: "completed",
                          status: "Order Delivered",
                          loc: "Customer's Address",
                          time: orderData.delivered_at ? new Date(orderData.delivered_at).toLocaleString() : formatStatusDate(3, 4),
                          showIf: ["completed"]
                        },
                        {
                          id: "to_receive",
                          status: "In Transit",
                          loc: "NCR Sorting Hub, Manila",
                          time: formatStatusDate(2, 2),
                          showIf: ["in_transit", "to_receive", "completed"]
                        },
                        {
                          id: "in_transit",
                          status: "Processed by Warehouse",
                          loc: "Distribution Center",
                          time: formatStatusDate(1, 4),
                          showIf: ["in_transit", "to_receive", "completed"]
                        },
                        {
                          id: "picked_up",
                          status: "Shipment Picked Up",
                          loc: "Seller's Hub",
                          time: formatStatusDate(1, 0),
                          showIf: ["in_transit", "to_receive", "completed"]
                        },
                        {
                          id: "to_ship",
                          status: "Order Confirmed",
                          loc: orderData.shops?.name || "Seller's Store",
                          time: formatStatusDate(0, 2),
                          showIf: ["to_ship", "in_transit", "to_receive", "completed"]
                        },
                        {
                          id: "to_pay",
                          status: "Order Placed",
                          loc: "Online",
                          time: baseDate.toLocaleString(),
                          showIf: ["to_pay", "to_ship", "in_transit", "to_receive", "completed"]
                        }
                      ];

                      const visibleSteps = allSteps.filter(step => step.showIf.includes(orderData.status));

                      return visibleSteps.map((log, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className={`h-3 w-3 rounded-full border-[3px] ${i === 0 ? "bg-primary border-slate-900" : "bg-white border-slate-200"} z-10 mt-1`} />
                            {i !== visibleSteps.length - 1 && <div className="flex-1 w-0.5 bg-slate-100 my-1" />}
                          </div>
                          <div className="pb-1 text-left">
                            <div className="flex flex-col">
                              <p className={`font-black tracking-tight leading-none mb-1 ${i === 0 ? "text-slate-900 text-sm" : "text-slate-500 text-xs"}`}>
                                {log.status}
                              </p>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                                {log.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-slate-400">
                              <MapPin className="h-2.5 w-2.5" />
                              <p className="text-[10px] font-bold leading-tight">{log.loc}</p>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : trackingNumber ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 bg-slate-50 rounded-lg flex items-center justify-center text-slate-200 mb-6">
            <Search className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter">
            Order Not Found
          </h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">
            We couldn't find any order with the
            tracking number "{trackingNumber}".
          </p>
          <Button
            variant="link"
            onClick={() => setTrackingNumber("")}
            className="mt-4 text-primary font-black"
          >
            Try another number
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-200">
          <Package className="h-24 w-24 opacity-20" />
          <p className="font-black uppercase tracking-widest mt-4">
            Waiting for tracking number
          </p>
        </div>
      )}

      <div className="bg-slate-900 rounded-lg p-8 border border-black flex flex-col md:flex-row items-center justify-between gap-6 text-white">
        <div className="space-y-1 text-left">
          <h4 className="text-lg font-black text-white">
            Need help with your shipment?
          </h4>
          <p className="text-sm font-medium text-slate-300">
            Get in touch with our customer support
            team for any issues or questions.
          </p>
        </div>
        <Link href="/core/transaction1/support">
          <Button className="bg-white text-slate-900 px-8 h-12 rounded-lg font-black hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest">
            Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
