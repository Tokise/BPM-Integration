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
        {
          id: toastId,
        },
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
      .update({ status: nextStatus })
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
      f.status.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/logistic">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Fleet Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Fleet Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Monitor vehicle status, maintenance
            logs, and fleet efficiency
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/logistic/dept2/driver">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 bg-white hover:bg-slate-50"
            >
              <Truck className="h-4 w-4 mr-2" />{" "}
              Driver Dashboard
            </Button>
          </Link>
          <Link href="/logistic/dept1/alms">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 bg-white hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />{" "}
              Register in ALMS
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-sm rounded-xl bg-white p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-blue-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="flex justify-between items-center relative">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
              {vehicles.length > 0
                ? Math.round(
                    (activeVehicles /
                      vehicles.length) *
                      100,
                  )
                : 0}
              % Active
            </span>
          </div>
          <div className="relative">
            <p className="text-2xl font-black text-slate-900">
              {loading
                ? "..."
                : `${vehicles.length} Vehicles`}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Total Operational Fleet
            </p>
          </div>
        </Card>
        <Card className="border shadow-sm rounded-xl bg-white p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-amber-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="flex justify-between items-center relative">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
              {inService} In Use
            </span>
          </div>
          <div className="relative">
            <p className="text-2xl font-black text-slate-900">
              Utilization
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Vehicle Allocation Monitor
            </p>
          </div>
        </Card>
        <Card className="border shadow-sm rounded-xl bg-white p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-green-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="flex justify-between items-center relative">
            <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Fuel className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">
              Optimal
            </span>
          </div>
          <div className="relative">
            <p className="text-2xl font-black text-slate-900">
              Fuel Log
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Efficiency Monitoring
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "fleet"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Vehicle Roster
          </button>
          <button
            onClick={() => setActiveTab("fbs")}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
              <span className="ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-md">
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

        <div className="relative group w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search roster or logs..."
            className="pl-10 h-11 bg-transparent border-slate-200 shadow-none rounded-xl focus-visible:ring-indigo-500 font-medium text-sm"
          />
        </div>
      </div>

      {activeTab === "fleet" ? (
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Vehicle
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Type
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-400 font-bold animate-pulse"
                      >
                        Loading fleet...
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
                          <td className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
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
                                <Car className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 leading-none uppercase tracking-wide">
                                <PrivacyMask
                                  value={
                                    vehicle.plate_number
                                  }
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-sm font-medium text-slate-600 capitalize">
                            {vehicle.vehicle_type ||
                              "—"}
                          </td>
                          <td className="p-6">
                            <span
                              className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${
                                vehicle.status ===
                                  "available" ||
                                vehicle.status ===
                                  "active"
                                  ? "bg-green-50 text-green-600"
                                  : vehicle.status ===
                                      "in-use"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-xl font-black text-[10px] uppercase text-primary"
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
                        <Car className="h-12 w-12 text-slate-100 mx-auto mb-2" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                          No vehicles registered
                        </p>
                        <Link href="/logistic/dept1/alms">
                          <Button
                            variant="link"
                            className="mt-2 text-primary font-bold text-xs"
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
              Loading dispatches...
            </div>
          ) : filteredFbs.length > 0 ? (
            filteredFbs.map((fbs) => (
              <Card
                key={fbs.id}
                className="border shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all bg-white relative"
              >
                <div className="p-8 space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {fbs.vehicles?.image_url ? (
                        <img
                          src={
                            fbs.vehicles.image_url
                          }
                          className="h-full w-full object-cover"
                          alt="Vehicle"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-slate-900">
                          <PrivacyMask
                            value={
                              fbs.products?.shops
                                ?.name ||
                              "Unknown Seller"
                            }
                          />
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase ${
                            fbs.status ===
                            "fbs_forwarded_to_fleet"
                              ? "bg-rose-50 text-rose-600"
                              : fbs.status ===
                                  "fbs_dispatched"
                                ? "bg-blue-50 text-blue-600"
                                : fbs.status ===
                                    "fbs_in_transit"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {fbs.status.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Pickup Item:{" "}
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
                        />{" "}
                        {fbs.vehicles &&
                          `(${fbs.vehicles.vehicle_type})`}
                      </p>
                    </div>
                  </div>

                  {fbs.status ===
                    "fbs_forwarded_to_fleet" && (
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
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
                        className="flex flex-col md:flex-row gap-2 w-full max-w-xl"
                      >
                        <select
                          name="vehicle"
                          required
                          className="h-10 bg-slate-50 border-none rounded-xl font-bold px-4 text-xs flex-1"
                          defaultValue=""
                        >
                          <option
                            value=""
                            disabled
                          >
                            Assign Vehicle...
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
                                {v.plate_number} —{" "}
                                {v.vehicle_type}
                              </option>
                            ))}
                        </select>
                        <select
                          name="driver"
                          required
                          className="h-10 bg-slate-50 border-none rounded-xl font-bold px-4 text-xs flex-1"
                          defaultValue=""
                        >
                          <option
                            value=""
                            disabled
                          >
                            Assign Driver...
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
                          className="h-10 rounded-xl font-black text-xs bg-indigo-500 hover:bg-indigo-600 text-white shrink-0 px-6"
                        >
                          Dispatch
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </form>
                    </div>
                  )}

                  {fbs.status !==
                    "fbs_forwarded_to_fleet" &&
                    fbs.status !==
                      "pending_inbound" && (
                      <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-slate-50">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAdvanceStatus(
                              fbs.id,
                              fbs.status,
                            )
                          }
                          className="rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-600 text-white h-10 px-5"
                        >
                          {fbs.status ===
                          "fbs_dispatched"
                            ? "Mark as In Transit"
                            : "Mark as Delivered to WH"}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                </div>
              </Card>
            ))
          ) : (
            <div className="p-20 bg-white rounded-3xl text-center border border-dashed border-slate-200">
              <Truck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                No active dispatches
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
