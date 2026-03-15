"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Car,
  Fuel,
  Wrench,
  Search,
  ExternalLink,
  Package,
  Truck,
  ChevronRight,
  Phone,
  UserPlus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { toast } from "sonner";
import { PrivacyMask } from "@/components/ui/privacy-mask";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FleetManagementPage() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<any[]>(
    [],
  );
  const [fbsPickups, setFbsPickups] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drivers, setDrivers] = useState<any[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState<
    "fleet" | "fbs" | "anec"
  >("fleet");
  const [anecOrders, setAnecOrders] = useState<
    any[]
  >([]);
  const [
    activeAssignments,
    setActiveAssignments,
  ] = useState<any[]>([]);

  // Dispatch Modal State
  const [
    isDispatchModalOpen,
    setIsDispatchModalOpen,
  ] = useState(false);
  const [assignmentSearch, setAssignmentSearch] =
    useState("");
  const [selectedOrder, setSelectedOrder] =
    useState<any>(null);
  const [dispatchType, setDispatchType] =
    useState<"fbs" | "anec">("anec");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Get logistic2_driver role_id
    const { data: roleData } = await supabase
      .schema("bpm-anec-global")
      .from("roles")
      .select("id")
      .eq("name", "logistic2_driver")
      .single();

    // Get Anec Express courier ID
    const { data: courierData } = await supabase
      .schema("bpm-anec-global")
      .from("logistics_providers")
      .select("id")
      .ilike("name", "Anec Express")
      .single();

    const [
      vehicleRes,
      fbsRes,
      driverRes,
      anecRes,
      assignmentRes,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("vehicles")
        .select("*"),
      supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .select(
          `
        id, quantity, status, vehicle_id, product_id, created_at,
        products(id, name, shop_id, shops(name)),
        vehicles:vehicle_id(id, plate_number, vehicle_type, image_url)
      `,
        )
        .eq("shipment_type", "fbs_inbound")
        .in("status", [
          "fbs_forwarded_to_fleet",
          "fbs_dispatched",
          "fbs_in_transit",
          "pending_inbound",
        ])
        .order("created_at", {
          ascending: false,
        }),
      roleData
        ? supabase
            .schema("bpm-anec-global")
            .from("profiles")
            .select("id, full_name")
            .eq("role_id", roleData.id)
        : Promise.resolve({ data: [] }),
      courierData
        ? supabase
            .schema("bpm-anec-global")
            .from("orders")
            .select(
              `
                id, order_number, total_amount, status, shipping_status, shipping_address, created_at,
                profiles:customer_id(full_name),
                order_items(id, product_id, product_name, quantity, price_at_purchase)
              `,
            )
            .eq("courier_id", courierData.id)
            .in("status", [
              "paid",
              "shipped",
              "to_receive",
              "in_transit",
            ])
            .order("created_at", {
              ascending: false,
            })
        : Promise.resolve({ data: [] }),
      supabase
        .schema("bpm-anec-global")
        .from("vehicle_reservations")
        .select(
          `
            id, driver_id, vehicle_id,
            profiles:driver_id(full_name),
            vehicles:vehicle_id(plate_number, vehicle_type)
          `,
        )
        .eq("status", "confirmed")
        .is("end_time", null),
    ]);

    if (vehicleRes.data)
      setVehicles(vehicleRes.data);
    if (fbsRes.data) setFbsPickups(fbsRes.data);
    if (driverRes.data)
      setDrivers(driverRes.data);
    if (anecRes.data)
      setAnecOrders(anecRes.data as any[]);
    if (assignmentRes.data)
      setActiveAssignments(assignmentRes.data);
    setLoading(false);
  };

  const handleAssignVehicle = async (
    procurementId: string,
    vId: string,
  ) => {
    if (!vId) {
      toast.error("No vehicle assigned");
      return;
    }
    const toastId = toast.loading(
      "Dispatching shipment to assigned asset...",
    );
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .update({
        vehicle_id: vId,
        status: "fbs_dispatched",
      })
      .eq("id", procurementId);

    if (error) {
      toast.error("Dispatch failed", {
        id: toastId,
        description: error.message,
      });
      return;
    }

    toast.success("Shipment Dispatched!", {
      id: toastId,
    });
    fetchAll();
  };

  const handleAdvanceStatus = async (
    procurementId: string,
    currentStatus: string,
  ) => {
    let nextStatus = "fbs_dispatched";
    if (currentStatus === "fbs_dispatched") {
      nextStatus = "fbs_in_transit";
    } else if (
      currentStatus === "fbs_in_transit"
    ) {
      nextStatus = "pending_inbound";
    }
    const toastId = toast.loading(
      `Updating to ${nextStatus}...`,
    );
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .update({
        status: nextStatus,
      })
      .eq("id", procurementId);

    if (error) {
      toast.error("Status update failed", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        `Status updated to ${nextStatus.replace(/_/g, " ")}`,
        { id: toastId },
      );
      fetchAll();
    }
  };

  const activeVehicles = vehicles.filter(
    (v) =>
      v.status === "available" ||
      v.status === "active",
  ).length;
  const inService = vehicles.filter(
    (v) =>
      v.status === "maintenance" ||
      v.status === "in-use",
  ).length;

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate_number
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      v.vehicle_type
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const filteredFbs = fbsPickups.filter(
    (f) =>
      f.shipment_type === "fbs_inbound" &&
      (f.products?.shops?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
        f.products?.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        f.status
          .toLowerCase()
          .includes(search.toLowerCase())),
  );

  const filteredAssignments =
    activeAssignments.filter(
      (a) =>
        a.profiles?.full_name
          ?.toLowerCase()
          .includes(
            assignmentSearch.toLowerCase(),
          ) ||
        a.vehicles?.plate_number
          ?.toLowerCase()
          .includes(
            assignmentSearch.toLowerCase(),
          ) ||
        a.vehicles?.vehicle_type
          ?.toLowerCase()
          .includes(
            assignmentSearch.toLowerCase(),
          ),
    );

  const [
    selectedAnecAssignment,
    setSelectedAnecAssignment,
  ] = useState<Record<string, string>>({});

  const handleDispatchAnecOrder = async (
    order: any,
  ) => {
    const assignmentId =
      selectedAnecAssignment[order.id];
    if (!assignmentId) {
      toast.error(
        "Please select an assignment (Driver & Asset)",
      );
      return;
    }

    const assignment = activeAssignments.find(
      (a) => a.id === assignmentId,
    );
    if (!assignment) return;

    const toastId = toast.loading(
      "Dispatching to driver...",
    );

    // Create shipment record for this order
    const { error: shipErr } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .insert({
        product_id:
          order.order_items?.[0]?.id || null,
        quantity:
          order.order_items?.reduce(
            (sum: number, i: any) =>
              sum + (i.quantity || 0),
            0,
          ) || 1,
        shipment_type: "order",
        status: "fbs_dispatched",
        vehicle_id: assignment.vehicle_id,
        order_id: order.id,
      });

    if (shipErr) {
      toast.error("Dispatch failed", {
        id: toastId,
        description: shipErr.message,
      });
      return;
    }

    // Update order status to in_transit
    await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .update({
        status: "in_transit",
        shipping_status: "in_transit",
      })
      .eq("id", order.id);

    toast.success("Order dispatched to driver!", {
      id: toastId,
    });
    fetchAll();
  };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept2"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Fleet Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Fleet Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Monitor vehicle status, maintenance
            logs, and efficiency • Dept 2
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Total Fleet",
            val: `${vehicles.length} Vehicles`,
            icon: Car,
            color: "blue",
            active:
              vehicles.length > 0
                ? Math.round(
                    (activeVehicles /
                      vehicles.length) *
                      100,
                  )
                : 0,
          },
          {
            label: "Allocation",
            val: "Utilization",
            icon: Wrench,
            color: "amber",
            sub: `${inService} In Use`,
          },
          {
            label: "Monitoring",
            val: "Fuel Log",
            icon: Fuel,
            color: "emerald",
            sub: "Optimal",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-lg overflow-hidden bg-white"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                    s.color === "blue" &&
                      "bg-blue-50 text-blue-600 border border-blue-100",
                    s.color === "amber" &&
                      "bg-amber-50 text-amber-600 border border-amber-100",
                    s.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600 border border-emerald-100",
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {s.label}
                    </p>
                    {s.active !== undefined && (
                      <span className="text-[8px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase leading-none">
                        {s.active}% Active
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-slate-900 leading-none">
                    {loading ? "..." : s.val}
                  </p>
                  {s.sub && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                      {s.sub}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
            {" "}
            <button
              onClick={() =>
                setActiveTab("fleet")
              }
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "fleet"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Vehicle Roster
            </button>
            <button
              onClick={() => setActiveTab("fbs")}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "fbs"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              FBS Pickups Log
              {fbsPickups.filter(
                (f) =>
                  f.status ===
                  "fbs_forwarded_to_fleet",
              ).length > 0 && (
                <span className="ml-2 bg-rose-600 text-white px-1.5 py-0.5 rounded text-[8px]">
                  {
                    fbsPickups.filter(
                      (f) =>
                        f.status ===
                        "fbs_forwarded_to_fleet",
                    ).length
                  }
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("anec")}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "anec"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Anec Express
              {anecOrders.filter((o) =>
                [
                  "paid",
                  "shipped",
                  "to_receive",
                ].includes(o.status),
              ).length > 0 && (
                <span className="ml-2 bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[8px]">
                  {
                    anecOrders.filter((o) =>
                      [
                        "paid",
                        "shipped",
                        "to_receive",
                      ].includes(o.status),
                    ).length
                  }
                </span>
              )}
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Filter roster or logs..."
              className="pr-10 h-9 bg-white border-slate-200 rounded-lg focus-visible:ring-indigo-500 font-bold text-slate-900 text-xs shadow-none placeholder:text-slate-300"
            />
          </div>
        </div>

        <CardContent className="p-0 min-h-[400px]">
          {activeTab === "fleet" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Vehicle
                    </th>
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Type
                    </th>
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-12 text-center text-slate-300 font-black uppercase tracking-widest text-[10px] animate-pulse"
                      >
                        Loading fleet roster...
                      </td>
                    </tr>
                  ) : filteredVehicles.length >
                    0 ? (
                    filteredVehicles.map(
                      (vehicle) => (
                        <tr
                          key={vehicle.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 group-hover:bg-white transition-colors">
                                {vehicle.image_url ? (
                                  <img
                                    src={
                                      vehicle.image_url
                                    }
                                    alt={
                                      vehicle.plate_number
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Car className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="font-black text-[10px] text-slate-900 uppercase tracking-widest leading-none">
                                <PrivacyMask
                                  value={
                                    vehicle.plate_number
                                  }
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-[10px] font-black text-slate-600 uppercase">
                            {vehicle.vehicle_type ||
                              "—"}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                vehicle.status ===
                                  "available" ||
                                  vehicle.status ===
                                    "active"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : vehicle.status ===
                                      "in-use"
                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100",
                              )}
                            >
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-md font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-20 text-center"
                      >
                        <Car className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                          No vehicles registered
                        </p>
                        <Link href="/logistic/dept1/alms">
                          <Button
                            variant="link"
                            className="mt-1 text-blue-600 font-black text-[9px] uppercase tracking-widest"
                          >
                            Register assets in
                            ALMS →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "fbs" && (
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-12 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse text-[10px]">
                  Loading dispatches...
                </div>
              ) : filteredFbs.length > 0 ? (
                filteredFbs.map((fbs) => (
                  <div
                    key={fbs.id}
                    className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 group-hover:bg-white transition-colors shadow-sm">
                        {fbs.vehicles
                          ?.image_url ? (
                          <img
                            src={
                              fbs.vehicles
                                .image_url
                            }
                            className="h-full w-full object-cover"
                            alt="Vehicle"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs font-black text-slate-900 uppercase">
                            <PrivacyMask
                              value={
                                fbs.products
                                  ?.shops?.name ||
                                "Unknown Seller"
                              }
                            />
                          </h3>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                              fbs.status ===
                                "fbs_forwarded_to_fleet"
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : fbs.status ===
                                    "fbs_dispatched"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : fbs.status ===
                                      "fbs_in_transit"
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100",
                            )}
                          >
                            {fbs.status.replace(
                              /_/g,
                              " ",
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {fbs.products?.name} •
                          Qty: {fbs.quantity}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Vehicle:{" "}
                          <PrivacyMask
                            value={
                              fbs.vehicles
                                ?.plate_number ||
                              "Awaiting Dispatch"
                            }
                          />
                          {fbs.vehicles &&
                            ` (${fbs.vehicles.vehicle_type})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {fbs.status ===
                      "fbs_forwarded_to_fleet" ? (
                        <Button
                          onClick={() => {
                            setSelectedOrder(fbs);
                            setDispatchType(
                              "fbs",
                            );
                            setIsDispatchModalOpen(
                              true,
                            );
                          }}
                          size="sm"
                          className="h-10 rounded-lg font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 px-6"
                        >
                          Dispatch
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-900 border-slate-200"
                            onClick={() => {
                              toast.info(
                                "Additional controls coming soon",
                                {
                                  description:
                                    "Administrative actions for shipment #" +
                                    fbs.id.slice(
                                      0,
                                      8,
                                    ),
                                },
                              );
                            }}
                          >
                            Other
                          </Button>
                          {fbs.status !==
                            "pending_inbound" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAdvanceStatus(
                                  fbs.id,
                                  fbs.status,
                                )
                              }
                              className="rounded-lg font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 shadow-sm"
                            >
                              {fbs.status ===
                              "fbs_dispatched"
                                ? "In Transit"
                                : "Arrived at WH"}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center">
                  <Truck className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                    No active dispatches
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === "anec" && (
            <div className="p-0">
              {anecOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-50">
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Order
                        </th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Customer
                        </th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Items
                        </th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Amount
                        </th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {anecOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="p-4">
                            <div className="font-black text-xs text-slate-900 uppercase">
                              #
                              {order.order_number ||
                                order.id
                                  .slice(0, 8)
                                  .toUpperCase()}
                            </div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              {new Date(
                                order.created_at,
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-[10px] font-bold text-slate-700 uppercase">
                            {(
                              order.profiles as any
                            )?.full_name ||
                              "Customer"}
                          </td>
                          <td className="p-4">
                            <div className="text-[10px] font-black text-slate-900 uppercase">
                              {order.order_items
                                ?.length ||
                                0}{" "}
                              item(s)
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">
                              {order.order_items
                                ?.map(
                                  (i: any) =>
                                    i.product_name,
                                )
                                .join(", ")}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-black text-slate-900">
                            ₱
                            {order.total_amount?.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                [
                                  "paid",
                                  "shipped",
                                  "to_receive",
                                ].includes(
                                  order.status,
                                )
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : order.status ===
                                      "in_transit"
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-slate-50 text-slate-600 border-slate-100",
                              )}
                            >
                              {order.status?.replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {[
                              "paid",
                              "shipped",
                              "to_receive",
                            ].includes(
                              order.status,
                            ) ? (
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(
                                      order,
                                    );
                                    setDispatchType(
                                      "anec",
                                    );
                                    setIsDispatchModalOpen(
                                      true,
                                    );
                                  }}
                                  className="h-8 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest px-4"
                                >
                                  <Truck className="h-3 w-3 mr-2" />
                                  Dispatch
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 justify-end text-amber-600 font-black text-[9px] uppercase">
                                <Truck className="h-3 w-3" />{" "}
                                In Transit
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center">
                  <Package className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                    No Anec Express orders pending
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDispatchModalOpen}
        onOpenChange={setIsDispatchModalOpen}
      >
        <DialogContent className="rounded-xl p-8 bg-white border shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-indigo-600" />
              Assign & Dispatch Shipment
            </DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {dispatchType === "anec"
                ? "Order #" +
                  (selectedOrder?.order_number ||
                    selectedOrder?.id?.slice(
                      0,
                      8,
                    ))
                : "FBS Pickup Assignment"}
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search drivers or vehicle plate numbers..."
                value={assignmentSearch}
                onChange={(e) =>
                  setAssignmentSearch(
                    e.target.value,
                  )
                }
                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-900 pl-4 pr-10 focus-visible:ring-indigo-500 shadow-none"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={async () => {
                      const toastId =
                        toast.loading(
                          "Confirming dispatch...",
                        );
                      try {
                        if (
                          dispatchType === "anec"
                        ) {
                          // Manually call dispatch logic for Anec
                          const assignment = a;
                          const order =
                            selectedOrder;

                          // Create shipment record
                          const {
                            error: shipErr,
                          } = await supabase
                            .schema(
                              "bpm-anec-global",
                            )
                            .from("shipments")
                            .insert({
                              product_id:
                                order
                                  .order_items?.[0]
                                  ?.product_id || null,
                              quantity:
                                order.order_items?.reduce(
                                  (
                                    sum: number,
                                    i: any,
                                  ) =>
                                    sum +
                                    (i.quantity ||
                                      0),
                                  0,
                                ) || 1,
                              shipment_type:
                                "order",
                              status:
                                "fbs_dispatched",
                              vehicle_id:
                                assignment.vehicle_id,
                              order_id: order.id,
                            });

                          if (shipErr)
                            throw shipErr;

                          await supabase
                            .schema(
                              "bpm-anec-global",
                            )
                            .from("orders")
                            .update({
                              status:
                                "in_transit",
                              shipping_status:
                                "in_transit",
                            })
                            .eq("id", order.id);

                          toast.success(
                            "Order dispatched to " +
                              a.profiles
                                ?.full_name,
                            { id: toastId },
                          );
                        } else {
                          // Call dispatch logic for FBS
                          const { error } =
                            await supabase
                              .schema(
                                "bpm-anec-global",
                              )
                              .from("shipments")
                              .update({
                                vehicle_id:
                                  a.vehicle_id,
                                status:
                                  "fbs_dispatched",
                              })
                              .eq(
                                "id",
                                selectedOrder.id,
                              );

                          if (error) throw error;
                          toast.success(
                            "FBS Pickup dispatched to " +
                              a.profiles
                                ?.full_name,
                            { id: toastId },
                          );
                        }

                        setIsDispatchModalOpen(
                          false,
                        );
                        setAssignmentSearch("");
                        fetchAll();
                      } catch (err: any) {
                        toast.error(
                          "Dispatch failed",
                          {
                            id: toastId,
                            description:
                              err.message,
                          },
                        );
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-900 capitalize leading-tight">
                          {a.profiles?.full_name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {
                            a.vehicles
                              ?.plate_number
                          }{" "}
                          •{" "}
                          {
                            a.vehicles
                              ?.vehicle_type
                          }
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  No active driver assignments
                  found
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
