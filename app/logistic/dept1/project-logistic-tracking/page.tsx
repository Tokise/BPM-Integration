"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Truck,
  ChevronRight,
  Package,
  Search,
  Layers,
  Plus,
  Camera,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ProjectLogisticTrackingPage() {
  const supabase = createClient();
  const [shipments, setShipments] = useState<
    any[]
  >([]);
  const [couriers, setCouriers] = useState<any[]>(
    [],
  );
  const [vehicles, setVehicles] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create shipment dialog
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState("");
  const [selectedVehicle, setSelectedVehicle] =
    useState("");
  const [orders, setOrders] = useState<any[]>([]);

  // Proof of delivery
  const [proofFile, setProofFile] =
    useState<File | null>(null);
  const proofInputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [
      shipRes,
      courierRes,
      vehicleRes,
      orderRes,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .select(
          "*, vehicles (plate_number, vehicle_type, image_url), orders (order_number, status, shipping_address)",
        )
        .order("id", { ascending: false }),
      supabase
        .schema("bpm-anec-global")
        .from("logistics_providers")
        .select("*")
        .eq("is_active", true),
      supabase
        .schema("bpm-anec-global")
        .from("vehicles")
        .select("id, plate_number, vehicle_type")
        .eq("status", "available"),
      supabase
        .schema("bpm-anec-global")
        .from("orders")
        .select(
          "id, order_number, status, shipping_address",
        )
        .in("status", ["to_ship", "to_pay"])
        .limit(50),
    ]);

    if (shipRes.data) setShipments(shipRes.data);
    if (courierRes.data)
      setCouriers(courierRes.data);
    if (vehicleRes.data)
      setVehicles(vehicleRes.data);
    if (orderRes.data) setOrders(orderRes.data);

    setLoading(false);
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder) {
      toast.error("Select an order");
      return;
    }

    const toastId = toast.loading(
      "Creating shipment & assigning courier...",
    );

    // Auto-assign: pick default courier
    const defaultCourier = couriers.find(
      (c) => c.is_default,
    );

    const trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .insert({
        order_id: selectedOrder,
        vehicle_id: selectedVehicle || null,
        status: "preparing",
      });

    if (error) {
      toast.error("Failed to create shipment", {
        id: toastId,
        description: error.message,
      });
    } else {
      // Update order status to shipping
      await supabase
        .schema("bpm-anec-global")
        .from("orders")
        .update({
          status: "shipping",
          shipping_status: "in_transit",
          courier_id: defaultCourier?.id || null,
        })
        .eq("id", selectedOrder);

      toast.success("Shipment Created!", {
        id: toastId,
        description: `Courier auto-assigned. Tracking: ${trackingNumber}`,
      });
      setIsCreateOpen(false);
      setSelectedOrder("");
      setSelectedVehicle("");
      fetchAll();
    }
  };

  const handleUpdateStatus = async (
    shipment: any,
    newStatus: string,
  ) => {
    const toastId = toast.loading(
      `Updating to ${newStatus}...`,
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .update({ status: newStatus })
      .eq("id", shipment.id);

    if (!error) {
      // If delivered, update order too
      if (newStatus === "delivered") {
        await supabase
          .schema("bpm-anec-global")
          .from("orders")
          .update({
            status: "delivered",
            shipping_status: "delivered",
            delivered_at:
              new Date().toISOString(),
          })
          .eq("id", shipment.order_id);
      }

      toast.success(
        `Status updated to ${newStatus}`,
        { id: toastId },
      );
      fetchAll();
    } else {
      toast.error("Update failed", {
        id: toastId,
        description: error.message,
      });
    }
  };

  const handleProofOfDelivery = async (
    shipment: any,
  ) => {
    if (!proofFile) {
      toast.error("Select a proof image first");
      return;
    }

    const toastId = toast.loading(
      "Uploading proof of delivery...",
    );

    const filePath = `pod-${shipment.id}-${Date.now()}.${proofFile.name.split(".").pop()}`;
    const { error: uploadError } =
      await supabase.storage
        .from("logistics-documents")
        .upload(filePath, proofFile);

    if (uploadError) {
      toast.error("Upload failed", {
        id: toastId,
        description: uploadError.message,
      });
      return;
    }

    // Mark as delivered
    await handleUpdateStatus(
      shipment,
      "delivered",
    );

    // Log in document tracking
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("logistics-documents")
      .getPublicUrl(filePath);

    await supabase
      .schema("bpm-anec-global")
      .from("document_tracking")
      .insert({
        doc_type: "proof_of_delivery",
        document_name: `POD - Order ${shipment.orders?.order_number || shipment.order_id.slice(0, 8)}`,
        document_type: proofFile.type,
        file_url: publicUrl,
        file_size: proofFile.size,
        reference_id: shipment.id,
        status: "verified",
      });

    toast.success(
      "Proof of delivery captured & shipment delivered!",
      { id: toastId },
    );
    setProofFile(null);
    fetchAll();
  };

  const statusFlow = [
    "preparing",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    return idx < statusFlow.length - 1
      ? statusFlow[idx + 1]
      : null;
  };

  const filtered = shipments.filter(
    (s) =>
      s.orders?.order_number
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      s.vehicles?.plate_number
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      s.status
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Project Logistic Tracking
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Courier assignment → Shipping → Proof
            of Delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAll}
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-4"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Dialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Create Shipment
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Create Shipment
                </DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Auto-assign courier & generate
                  tracking
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Order
                  </label>
                  <select
                    value={selectedOrder}
                    onChange={(e) =>
                      setSelectedOrder(
                        e.target.value,
                      )
                    }
                    className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold mt-1 px-4"
                  >
                    <option value="">
                      Select order...
                    </option>
                    {orders.map((o) => (
                      <option
                        key={o.id}
                        value={o.id}
                      >
                        {o.order_number ||
                          o.id.slice(0, 8)}{" "}
                        — {o.shipping_address}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Vehicle (Optional)
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) =>
                      setSelectedVehicle(
                        e.target.value,
                      )
                    }
                    className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold mt-1 px-4"
                  >
                    <option value="">
                      Auto-assign
                    </option>
                    {vehicles.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                      >
                        {v.plate_number} —{" "}
                        {v.vehicle_type}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleCreateShipment}
                  className="w-full h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 mt-2"
                >
                  Create & Auto-Assign Courier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Active Shipments",
            val: shipments.filter(
              (s) => s.status !== "delivered",
            ).length,
            icon: Truck,
            color: "blue",
          },
          {
            label: "In Transit",
            val: shipments.filter(
              (s) => s.status === "in_transit",
            ).length,
            icon: MapPin,
            color: "amber",
          },
          {
            label: "Out for Delivery",
            val: shipments.filter(
              (s) =>
                s.status === "out_for_delivery",
            ).length,
            icon: Package,
            color: "purple",
          },
          {
            label: "Delivered",
            val: shipments.filter(
              (s) => s.status === "delivered",
            ).length,
            icon: CheckCircle2,
            color: "emerald",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white relative group overflow-hidden"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${s.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8 relative">
              <div
                className={`h-12 w-12 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-4`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by order #, plate, or status..."
            className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-medium"
          />
        </div>
      </div>

      {/* Shipment Cards */}
      <div className="grid gap-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
            Loading shipments...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((shipment) => {
            const nextStatus = getNextStatus(
              shipment.status,
            );
            return (
              <Card
                key={shipment.id}
                className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all group bg-white"
              >
                <div className="p-8 space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {shipment.vehicles
                        ?.image_url ? (
                        <img
                          src={
                            shipment.vehicles
                              .image_url
                          }
                          className="h-full w-full object-cover"
                          alt="Vehicle"
                        />
                      ) : (
                        <Layers className="h-8 w-8 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-slate-900">
                          Order{" "}
                          {shipment.orders
                            ?.order_number ||
                            shipment.order_id
                              ?.slice(0, 8)
                              .toUpperCase()}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase ${
                            shipment.status ===
                            "delivered"
                              ? "bg-green-50 text-green-600"
                              : shipment.status ===
                                  "in_transit"
                                ? "bg-blue-50 text-blue-600"
                                : shipment.status ===
                                    "out_for_delivery"
                                  ? "bg-purple-50 text-purple-600"
                                  : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {shipment.status?.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Vehicle:{" "}
                        {shipment.vehicles
                          ?.plate_number ||
                          "Not assigned"}{" "}
                        •{" "}
                        {shipment.orders
                          ?.shipping_address ||
                          "No address"}
                      </p>
                    </div>
                  </div>

                  {/* Status Pipeline */}
                  <div className="flex items-center gap-2 py-4">
                    {statusFlow.map(
                      (step, idx) => {
                        const stepIdx =
                          statusFlow.indexOf(
                            shipment.status,
                          );
                        const isComplete =
                          idx <= stepIdx;
                        const isCurrent =
                          idx === stepIdx;
                        return (
                          <div
                            key={step}
                            className="flex items-center gap-2 flex-1"
                          >
                            <div
                              className={`h-8 flex-1 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider ${
                                isComplete
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-slate-50 text-slate-300"
                              }`}
                            >
                              {step.replace(
                                "_",
                                " ",
                              )}
                            </div>
                            {idx <
                              statusFlow.length -
                                1 && (
                              <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Actions */}
                  {shipment.status !==
                    "delivered" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(
                              shipment,
                              nextStatus,
                            )
                          }
                          className="rounded-xl font-black text-xs bg-blue-500 hover:bg-blue-600 text-white h-10 px-5"
                        >
                          Advance to{" "}
                          {nextStatus.replace(
                            "_",
                            " ",
                          )}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      {shipment.status ===
                        "out_for_delivery" && (
                        <>
                          <input
                            type="file"
                            ref={proofInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              setProofFile(
                                e.target
                                  .files?.[0] ||
                                  null,
                              )
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              proofInputRef.current?.click()
                            }
                            className="rounded-xl font-black text-xs h-10 px-5 border-slate-200"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            {proofFile
                              ? proofFile.name
                              : "Capture POD"}
                          </Button>
                          {proofFile && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleProofOfDelivery(
                                  shipment,
                                )
                              }
                              className="rounded-xl font-black text-xs bg-green-500 hover:bg-green-600 text-white h-10 px-5"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Confirm Delivery
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="p-20 bg-white rounded-3xl text-center border border-dashed border-slate-200">
            <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
              No active shipments found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
