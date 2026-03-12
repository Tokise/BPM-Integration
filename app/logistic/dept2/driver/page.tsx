"use client";

import { useEffect, useState } from "react";
import {
  Car,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Truck,
  ShieldCheck,
  Fuel,
  QrCode,
  Navigation,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import { useUser } from "@/context/UserContext";

export default function DriverDashboard() {
  const {
    profile: userProfile,
    loading: userLoading,
  } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [
    activeReservation,
    setActiveReservation,
  ] = useState<any>(null);
  const [activeShipments, setActiveShipments] =
    useState<any[]>([]);
  const [tripHistory, setTripHistory] = useState<
    any[]
  >([]);

  useEffect(() => {
    if (!userLoading && userProfile) {
      if (
        userProfile.role !== "driver" &&
        userProfile.role !== "admin"
      ) {
        toast.error(
          "Access denied. Drivers only.",
        );
        return;
      }
      fetchDriverData();
    }
  }, [userProfile, userLoading]);

  const fetchDriverData = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    const [reservationRes, shipmentRes] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("vehicle_reservations")
          .select(`*, vehicles:vehicle_id(*)`)
          .eq("driver_id", userProfile.id)
          .order("start_time", {
            ascending: false,
          })
          .limit(1),
        supabase
          .schema("bpm-anec-global")
          .from("shipments")
          .select(
            `*, products(name, shops(name))`,
          )
          .eq("status", "fbs_dispatched")
          .order("created_at", {
            ascending: false,
          }),
      ]);

    fetchTripHistory();

    if (reservationRes.data?.[0])
      setActiveReservation(
        reservationRes.data[0],
      );
    if (shipmentRes.data)
      setActiveShipments(shipmentRes.data);

    setLoading(false);
  };

  const handleStartTrip = async () => {
    if (!activeReservation) return;

    const startPromise = async () => {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("vehicles")
        .update({ status: "in-use" })
        .eq("id", activeReservation.vehicle_id);
      if (error) throw error;
    };

    toast.promise(startPromise(), {
      loading: "Starting your trip...",
      success: "Trip started! Drive safe.",
      error: "Failed to start trip.",
    });
    fetchDriverData();
  };

  const handleLogAttendance = async () => {
    if (!userProfile?.id) return;

    const logPromise = async () => {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("attendance")
        .insert({
          employee_id: userProfile.id,
          check_in: new Date().toISOString(),
          status: "present",
        });
      if (error) throw error;
    };

    toast.promise(logPromise(), {
      loading: "Logging attendance...",
      success: "Attendance logged successfully!",
      error: "Failed to log attendance.",
    });
  };

  const fetchTripHistory = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("vehicle_reservations")
      .select(`*, vehicles:vehicle_id(*)`)
      .eq("driver_id", userProfile.id)
      .not("end_time", "is", null)
      .order("end_time", { ascending: false });

    if (data) setTripHistory(data);
  };

  const handleCompleteDelivery = async (
    shipmentId: string,
  ) => {
    const updatePromise = async () => {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .update({ status: "pending_inbound" })
        .eq("id", shipmentId);
      if (error) throw error;
    };

    toast.promise(updatePromise(), {
      loading: "Updating shipment status...",
      success: "Delivery marked as completed!",
      error: "Failed to update shipment.",
    });
    fetchDriverData();
  };

  if (userLoading || loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (
    !userProfile ||
    (userProfile.role !== "driver" &&
      userProfile.role !== "admin")
  ) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          Access Denied
        </h2>
        <p className="text-slate-500 mt-2">
          Only registered drivers can access this
          hub.
        </p>
        <Button
          asChild
          className="mt-8 rounded-xl bg-slate-900"
        >
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/logistic/dept2">
                Fleet Ops
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Driver Hub
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Driver Hub
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Welcome back,{" "}
            {userProfile?.full_name || "Driver"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 font-bold h-11 px-6"
          >
            <QrCode className="h-4 w-4 mr-2" />{" "}
            Scan Vehicle
          </Button>
          <Button
            onClick={handleLogAttendance}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-indigo-200"
          >
            Attendance Log
          </Button>
        </div>
      </div>

      {/* Active Vehicle & Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-sm rounded-xl bg-white relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${activeReservation?.vehicles?.status === "in-use" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}
              >
                {activeReservation?.vehicles
                  ?.status || "STANDBY"}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Active Vehicle
              </p>
              <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">
                {activeReservation?.vehicles
                  ?.plate_number ? (
                  <PrivacyMask
                    value={
                      activeReservation.vehicles
                        .plate_number
                    }
                  />
                ) : (
                  "—"
                )}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                {activeReservation?.vehicles
                  ?.vehicle_type ||
                  "No assignment"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl bg-white relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Navigation className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                ACTIVE
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Shipments
              </p>
              <h3 className="text-2xl font-black text-slate-900 leading-none">
                {activeShipments.length} Tasks
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                Pending fulfillment
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl bg-white relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-20" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600">
                TOP RATED
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Personal Rating
              </p>
              <h3 className="text-2xl font-black text-slate-900 leading-none">
                4.9 / 5.0
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                Performance Score
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed: Active Shipments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              Current Dispatches
            </h2>
            <Button
              variant="ghost"
              className="text-xs font-bold text-indigo-600"
            >
              View All
            </Button>
          </div>

          {activeShipments.length > 0 ? (
            activeShipments.map((shipment) => (
              <Card
                key={shipment.id}
                className="border shadow-sm rounded-xl overflow-hidden bg-white hover:scale-[1.005] transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                      <Package className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-black text-slate-900">
                            {
                              shipment.products
                                ?.name
                            }
                          </h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Shop:{" "}
                            {shipment.products
                              ?.shops?.name ||
                              "Global Store"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase">
                          {shipment.status.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-300" />
                          <div className="text-[10px]">
                            <p className="font-black text-slate-400 uppercase leading-none">
                              Destination
                            </p>
                            <p className="font-bold text-slate-700">
                              Central Warehouse
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-300" />
                          <div className="text-[10px]">
                            <p className="font-black text-slate-400 uppercase leading-none">
                              ETA
                            </p>
                            <p className="font-bold text-slate-700">
                              Today, 4:00 PM
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() =>
                            handleCompleteDelivery(
                              shipment.id,
                            )
                          }
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-10 px-6"
                        >
                          Complete Delivery
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl border-slate-200 font-bold h-10 px-4"
                        >
                          Report Issue
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-none shadow-sm rounded-[32px] p-20 text-center bg-white/50 border border-dashed border-slate-200">
              <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                No active dispatches found
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar: Vehicle Check-in */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">
            Trip Control
          </h2>
          <Card className="border shadow-sm rounded-xl bg-slate-900 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-24 bg-white/5 skew-x-12 translate-x-12" />
            <div className="relative space-y-6">
              <div>
                <h4 className="text-xl font-black tracking-tighter">
                  Trip Control
                </h4>
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Ready for Dispatch
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fuel className="h-4 w-4 text-indigo-400" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500 leading-none">
                        Fuel Level
                      </p>
                      <p className="text-xs font-bold mt-1">
                        85% Full
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-indigo-500" />
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 leading-none">
                      Trip Duration
                    </p>
                    <p className="text-xs font-bold mt-1">
                      0h 45m
                    </p>
                  </div>
                </div>
              </div>

              {activeReservation?.vehicles
                ?.status === "available" ? (
                <Button
                  onClick={handleStartTrip}
                  className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  Start Trip
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-11 border-white/10 hover:bg-white/5 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  Trip Live
                </Button>
              )}
            </div>
          </Card>

          <Card className="border shadow-sm rounded-xl bg-white p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Driver Toolkit
            </h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-between rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 text-xs"
              >
                Maintenance Log{" "}
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 text-xs"
              >
                Insurance Copy{" "}
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 h-10 text-xs"
              >
                Route Assistant{" "}
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>

          <Card className="border shadow-sm rounded-xl bg-white p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Recent Trip History
            </h4>
            <div className="space-y-4">
              {tripHistory.length > 0 ? (
                tripHistory.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <History className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 leading-none">
                          {trip.vehicles
                            ?.plate_number ||
                            "TRIP-" +
                              trip.id.slice(0, 4)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">
                          {new Date(
                            trip.end_time ||
                              trip.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                      Done
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No completed trips
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
