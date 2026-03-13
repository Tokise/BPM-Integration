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
  CheckCircle2,
  Phone,
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
    "fleet" | "fbs"
  >("fleet");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [vehicleRes, fbsRes, driverRes] =
      await Promise.all([
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
        supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id, full_name")
          .eq("role", "driver"),
      ]);

    if (vehicleRes.data)
      setVehicles(vehicleRes.data);
    if (fbsRes.data) setFbsPickups(fbsRes.data);
    if (driverRes.data)
      setDrivers(driverRes.data);
    setLoading(false);
  };

  const handleAssignVehicle = async (
    procurementId: string,
    vId: string,
    dId: string,
  ) => {
    if (!vId || !dId) {
      toast.error(
        "Please select both a vehicle and a driver",
      );
      return;
    }
    const toastId = toast.loading(
      "Assigning vehicle and driver...",
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
      toast.error("Assignment failed", {
        id: toastId,
        description: error.message,
      });
      return;
    }

    const { error: reserveError } = await supabase
      .schema("bpm-anec-global")
      .from("vehicle_reservations")
      .insert({
        vehicle_id: vId,
        driver_id: dId,
        start_time: new Date().toISOString(),
      });

    if (reserveError) {
      toast.error("Driver reservation failed", {
        id: toastId,
        description: reserveError.message,
      });
    } else {
      toast.success(
        "Vehicle & Driver Dispatched!",
        { id: toastId },
      );
      fetchAll();
    }
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
      f.products?.shops?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      f.products?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      f.status
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

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

        <CardContent className="p-0">
          {activeTab === "fleet" ? (
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
          ) : (
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
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData =
                              new FormData(
                                e.currentTarget,
                              );
                            const vehicleId =
                              formData.get(
                                "vehicle",
                              ) as string;
                            const driverId =
                              formData.get(
                                "driver",
                              ) as string;
                            handleAssignVehicle(
                              fbs.id,
                              vehicleId,
                              driverId,
                            );
                          }}
                          className="flex flex-col md:flex-row gap-2"
                        >
                          <select
                            name="vehicle"
                            required
                            className="h-10 bg-slate-50 border border-slate-200 rounded-lg font-bold px-4 text-[10px] uppercase tracking-widest w-40 text-slate-900"
                            defaultValue=""
                          >
                            <option
                              value=""
                              disabled
                            >
                              Vehicle...
                            </option>
                            {vehicles
                              .filter(
                                (v) =>
                                  v.status ===
                                    "available" ||
                                  v.status ===
                                    "active",
                              )
                              .map((v) => (
                                <option
                                  key={v.id}
                                  value={v.id}
                                >
                                  {v.plate_number}
                                </option>
                              ))}
                          </select>
                          <select
                            name="driver"
                            required
                            className="h-10 bg-slate-50 border border-slate-200 rounded-lg font-bold px-4 text-[10px] uppercase tracking-widest w-40 text-slate-900"
                            defaultValue=""
                          >
                            <option
                              value=""
                              disabled
                            >
                              Driver...
                            </option>
                            {drivers.map((d) => (
                              <option
                                key={d.id}
                                value={d.id}
                              >
                                {d.full_name}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="submit"
                            size="sm"
                            className="h-10 rounded-lg font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 px-6"
                          >
                            Dispatch
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </form>
                      ) : (
                        fbs.status !==
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
                        )
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
        </CardContent>
      </Card>
    </div>
  );
}
