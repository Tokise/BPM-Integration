"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Car,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  History as HistoryIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PrivacyMask } from "@/components/ui/privacy-mask";

export default function DriverFleetPage() {
  const {
    profile: userProfile,
    loading: userLoading,
  } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [assignedVehicle, setAssignedVehicle] =
    useState<any>(null);
  const [activeShipments, setActiveShipments] =
    useState<any[]>([]);
  const [historyShipments, setHistoryShipments] =
    useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"fbs" | "orders">("fbs");
  const [historyTab, setHistoryTab] = useState<"fbs" | "orders">("fbs");

  useEffect(() => {
    if (!userLoading && userProfile) {
      const userRole =
        userProfile.role?.toLowerCase();
      if (
        userRole !== "logistic2_driver" &&
        userRole !== "admin"
      ) {
        return;
      }
      fetchFleetData();
    }
  }, [userProfile, userLoading]);

  const fetchFleetData = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    try {
      // 1. Fetch ALL active vehicle reservations for the driver
      const {
        data: reservations,
        error: resError,
      } = await supabase
        .schema("bpm-anec-global")
        .from("vehicle_reservations")
        .select(`*, vehicles:vehicle_id(*)`)
        .eq("driver_id", userProfile.id)
        .is("end_time", null)
        .order("start_time", { ascending: false });

      if (resError) throw resError;
      
      const activeRes = reservations || [];
      setAssignedVehicle(activeRes[0]?.vehicles || null);

      // 2. Fetch Active Shipments for ALL currently reserved vehicles
      if (activeRes.length > 0) {
        const vehicleIds = activeRes.map(r => r.vehicle_id);
        const { data: shipments, error: shipError } = await supabase
          .schema("bpm-anec-global")
          .from("shipments")
          .select(`*, products(name, shops(name))`)
          .in("vehicle_id", vehicleIds)
          .in("status", ["fbs_dispatched", "fbs_in_transit"])
          .order("created_at", { ascending: false });

        if (shipError) throw shipError;
        setActiveShipments(shipments || []);
      } else {
        setActiveShipments([]);
      }

      // 3. Fetch History (by driver_id for persistence)
      const { data: history, error: histError } = await supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .select(`*, products(name, shops(name)), vehicle_reservations!inner(driver_id)`)
        .eq("vehicle_reservations.driver_id", userProfile.id)
        .in("status", ["delivered", "pending_inbound"])
        .order("created_at", { ascending: false })
        .limit(30);
      
      if (histError) {
          // Fallback if the join is not supported by schema exactly as written
          const { data: altHistory } = await supabase
            .schema("bpm-anec-global")
            .from("shipments")
            .select(`*, products(name, shops(name))`)
            .in("status", ["delivered", "pending_inbound"])
            .order("created_at", { ascending: false })
            .limit(30);
          setHistoryShipments(altHistory || []);
      } else {
          setHistoryShipments(history || []);
      }

    } catch (error: any) {
      toast.error("Failed to fetch fleet data", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipment = async (
    shipmentId: string,
    currentStatus: string,
    shipmentType: string,
    orderId?: string
  ) => {
    let nextStatus = "fbs_in_transit";
    if (currentStatus === "fbs_in_transit") {
      nextStatus = shipmentType === "order" ? "delivered" : "pending_inbound";
    }

    const toastId = toast.loading(
      `Updating to ${nextStatus.replace(/_/g, " ")}...`,
    );

    try {
      // Update shipment status
      const { error: shipmentError } = await supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .update({ status: nextStatus })
        .eq("id", shipmentId);
      
      if (shipmentError) throw shipmentError;

      // If it's an order, sync with the order table
      if (orderId && shipmentType === 'order') {
        const orderStatus = nextStatus === "fbs_in_transit" ? "in_transit" : "delivered";
        const { error: orderError } = await supabase
          .schema("bpm-anec-global")
          .from("orders")
          .update({ 
            status: orderStatus,
            shipping_status: orderStatus,
            delivered_at: orderStatus === "delivered" ? new Date().toISOString() : null
          })
          .eq("id", orderId);
        
        if (orderError) throw orderError;
      }

      toast.success("Logistics updated successfully!", { id: toastId });
      fetchFleetData();
    } catch (err: any) {
      toast.error("Update failed", { id: toastId, description: err.message });
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept2/driver"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              My Fleet
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Vehicle Assignment
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Details of your currently assigned
            assets • Dept 2
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Vehicle Card */}
        <Card className="border shadow-none rounded-lg overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Assigned Vehicle
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400">
                  Equipment Details
                </CardDescription>
              </div>
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center border",
                  assignedVehicle
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-slate-100 text-slate-400 border-slate-200",
                )}
              >
                <Car className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {assignedVehicle ? (
              <div className="flex items-center gap-6">
                <div className="h-24 w-32 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shadow-inner shrink-0 leading-none flex items-center justify-center">
                  {assignedVehicle.image_url ? (
                    <img
                      src={
                        assignedVehicle.image_url
                      }
                      alt="Vehicle"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Car className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Plate Number
                    </p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">
                      <PrivacyMask
                        value={
                          assignedVehicle.plate_number
                        }
                      />
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Type
                      </p>
                      <p className="text-xs font-black text-slate-700 uppercase">
                        {
                          assignedVehicle.vehicle_type
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </p>
                      <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase tracking-widest">
                        {assignedVehicle.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <AlertCircle className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No Vehicle Assigned
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                  Contact dispatch to receive
                  equipment
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Checklist Card */}
        <Card className="border shadow-none rounded-lg overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
              Pre-Trip Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                {
                  label: "Vehicle Inspection",
                  status: "Verified",
                  icon: ShieldCheck,
                },
                {
                  label: "Safety Equipment",
                  status: "On Board",
                  icon: ShieldCheck,
                },
                {
                  label: "Documentation",
                  status: "Digital Copy",
                  icon: ShieldCheck,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[8px] font-black text-emerald-600 uppercase">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-none rounded-lg overflow-hidden bg-white mt-6">
        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              Active Assignments
            </CardTitle>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button 
              onClick={() => setActiveTab("fbs")}
              className={cn("px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all", activeTab === "fbs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              FBS Pickups
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={cn("px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all", activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              Customer Orders
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeShipments.filter(s => activeTab === "fbs" ? s.shipment_type === "fbs_inbound" : s.shipment_type === "order").length > 0 ? (
            <div className="divide-y divide-slate-50">
              {activeShipments
                .filter(s => activeTab === "fbs" ? s.shipment_type === "fbs_inbound" : s.shipment_type === "order")
                .map((shipment) => (
                <div
                  key={shipment.id}
                  className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-white transition-colors">
                      <Package className="h-6 w-6 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black text-slate-900 uppercase">
                          <PrivacyMask
                            value={
                              shipment.products
                                ?.shops?.name ||
                              "Unknown Seller"
                            }
                          />
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border",
                            shipment.status ===
                              "fbs_dispatched"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : shipment.status ===
                                  "fbs_in_transit"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100",
                          )}
                        >
                          {shipment.status.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {shipment.items?.list ? (
                           <div className="flex flex-wrap gap-2 mt-1">
                              {shipment.items.list.map((it: any, i: number) => (
                                <span key={i} className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[8px]">{it.name} (x{it.quantity})</span>
                              ))}
                           </div>
                        ) : (
                          <p>{shipment.products?.name} • Qty: {shipment.quantity}</p>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Dispatched:{" "}
                        {new Date(
                          shipment.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleUpdateShipment(
                          shipment.id,
                          shipment.status,
                          shipment.shipment_type,
                          shipment.order_id
                        )
                      }
                      className="rounded-lg font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white h-10 px-6"
                    >
                      {shipment.status ===
                      "fbs_dispatched"
                        ? "Start Transit"
                        : shipment.shipment_type === "fbs_inbound" ? "Mark as Arrived" : "Mark as Delivered"}
                      <ChevronRight className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center">
              <Truck className="h-10 w-10 text-slate-100 mx-auto mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No {activeTab === "fbs" ? "FBS" : "Customer Order"} Assignments
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-none rounded-lg overflow-hidden bg-white mt-6">
        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-slate-400" />
              Fleet History
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400">
              Completed Tasks for your account
            </CardDescription>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button 
              onClick={() => setHistoryTab("fbs")}
              className={cn("px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all", historyTab === "fbs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              FBS History
            </button>
            <button 
              onClick={() => setHistoryTab("orders")}
              className={cn("px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all", historyTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              Order History
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Assignment</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                    <HistoryIcon className="h-3 w-3 text-slate-300 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px]">
                {historyShipments.filter(s => historyTab === "fbs" ? s.shipment_type === "fbs_inbound" : s.shipment_type === "order").length > 0 ? (
                  historyShipments
                    .filter(s => historyTab === "fbs" ? s.shipment_type === "fbs_inbound" : s.shipment_type === "order")
                    .map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 group">
                      <td className="p-4">
                         <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                               <Package className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                               <div className="font-bold text-slate-700 uppercase">
                                 {s.items?.list ? `${s.items.list.length} Items (Consolidated)` : s.products?.name}
                               </div>
                               <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                 Completed on {new Date(s.updated_at || s.created_at).toLocaleDateString()}
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-500 font-black uppercase text-[8px] bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-12 text-center text-slate-300 font-black uppercase tracking-widest text-[9px]">
                      No {historyTab === "fbs" ? "FBS" : "Order"} history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
