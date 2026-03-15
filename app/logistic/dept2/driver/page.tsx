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
  Navigation,
  History as HistoryIcon,
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
import { cn } from "@/lib/utils";

export default function DriverDashboard() {
  const {
    profile: userProfile,
    loading: userLoading,
  } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
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
    if (!userLoading && userProfile && !fetched) {
      const userRole =
        userProfile.role?.toLowerCase();
      if (
        userRole !== "logistic2_driver" &&
        userRole !== "admin"
      ) {
        toast.error(
          "Access denied. Drivers only.",
        );
        return;
      }
      fetchDriverData();
      setFetched(true);
    }
  }, [userProfile, userLoading, fetched]);

  const fetchDriverData = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    const { data: reservationRes } = await supabase
      .schema("bpm-anec-global")
      .from("vehicle_reservations")
      .select(`*, vehicles:vehicle_id(*)`)
      .eq("driver_id", userProfile.id)
      .eq("status", "confirmed")
      .order("start_time", {
        ascending: false,
      })
      .limit(1);

    const res = reservationRes?.[0];
    if (res) {
      setActiveReservation(res);

      const { data: shipmentRes } = await supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .select(
          `*, products(name, shops(name))`
        )
        .eq("vehicle_id", res.vehicle_id)
        .in("status", ["fbs_dispatched", "fbs_in_transit"])
        .order("created_at", {
          ascending: false,
        });

      if (shipmentRes) setActiveShipments(shipmentRes);
    } else {
      setActiveReservation(null);
      setActiveShipments([]);
    }

    fetchTripHistory();
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


  if (userLoading || loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (
    !userProfile ||
    (userProfile.role?.toLowerCase() !==
      "logistic2_driver" &&
      userProfile.role?.toLowerCase() !== "admin")
  ) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-lg bg-red-50 flex items-center justify-center mb-4 border border-red-100">
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
          className="mt-8 rounded-lg bg-slate-900"
        >
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Driver Hub
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Welcome back,{" "}
            {userProfile?.full_name || "Driver"} •
            Trip Central
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Active Assignment",
            val: activeReservation?.vehicles
              ?.plate_number ? (
              <PrivacyMask
                value={
                  activeReservation.vehicles
                    .plate_number
                }
              />
            ) : (
              "STANDBY"
            ),
            icon: Truck,
            color: "blue",
            status:
              activeReservation?.vehicles
                ?.status || "READY",
          },
          {
            label: "Pending Tasks",
            val: `${activeShipments.length} Shipments`,
            icon: Navigation,
            color: "emerald",
            status: "ACTIVE",
          },
          {
            label: "Driver Rating",
            val: "4.9 / 5.0",
            icon: ShieldCheck,
            color: "amber",
            status: "TOP RATED",
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
                    "h-10 w-10 rounded-lg flex items-center justify-center border",
                    s.color === "blue" &&
                      "bg-blue-50 text-blue-600 border-blue-100",
                    s.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600 border-emerald-100",
                    s.color === "amber" &&
                      "bg-amber-50 text-amber-600 border-amber-100",
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {s.label}
                    </p>
                    {s.label ===
                    "Active Assignment" ? (
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded leading-none">
                        <Car className="h-3 w-3 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase">
                          {activeReservation
                            ? activeReservation
                                .vehicles
                                ?.plate_number
                            : "Ready"}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded border uppercase leading-none",
                          s.color === "blue" &&
                            "bg-blue-50 text-blue-600 border-blue-100",
                          s.color === "emerald" &&
                            "bg-emerald-50 text-emerald-600 border-emerald-100",
                          s.color === "amber" &&
                            "bg-amber-50 text-amber-600 border-amber-100",
                        )}
                      >
                        {s.status}
                      </span>
                    )}
                  </div>

                  {s.label ===
                  "Active Assignment" ? (
                    <div className="space-y-1">
                      <p className="text-xl font-black text-slate-900 leading-none">
                        {activeReservation
                          ? activeReservation
                              .vehicles
                              ?.vehicle_type
                          : "STANDBY"}
                      </p>
                      {activeReservation && (
                        <Link
                          href="/logistic/dept2/driver/vehicle"
                          className="inline-flex items-center text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                        >
                          View Vehicle Details
                          <ChevronRight className="h-2 w-2 ml-1" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <h3 className="text-xl font-black text-slate-900 leading-none">
                      {s.val}
                    </h3>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-none rounded-lg bg-indigo-50/50 border-indigo-100 p-8 text-center">
            <Package className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">
              Delivery Management
            </h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight mt-2 max-w-xs mx-auto">
              Access your assigned shipments and manage delivery tasks from your fleet console.
            </p>
            <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg h-10 px-6 text-[10px] uppercase tracking-widest shadow-sm">
              <Link href="/logistic/dept2/driver/fleet">
                Go to My Fleet
                <ChevronRight className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="px-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Trip Control
            </h2>
          </div>

          <Card className="border shadow-sm rounded-lg bg-slate-900 border-slate-800 p-6 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-full w-24 bg-white/5 skew-x-12 translate-x-12" />
            <div className="relative space-y-6">
              <div>
                <h4 className="text-lg font-black tracking-tighter uppercase">
                  Live Control
                </h4>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Ready for Dispatch
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fuel className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 leading-none">
                        Fuel Level
                      </p>
                      <p className="text-[11px] font-bold mt-1 uppercase text-slate-300">
                        85% Full
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-500" />
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-500 leading-none">
                      Duration
                    </p>
                    <p className="text-[11px] font-bold mt-1 uppercase text-slate-300">
                      0h 45m
                    </p>
                  </div>
                </div>
              </div>

              {activeReservation?.vehicles
                ?.status === "available" ? (
                <Button
                  onClick={handleStartTrip}
                  className="w-full h-10 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-lg text-[10px] uppercase tracking-widest transition-colors"
                >
                  Start Trip
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-10 border-white/10 hover:bg-white/5 text-white font-black rounded-lg text-[10px] uppercase tracking-widest"
                >
                  Trip Live
                </Button>
              )}
            </div>
          </Card>

          <Card className="border shadow-sm rounded-lg bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Driver Toolkit
              </h4>
            </div>
            <div className="p-2 space-y-1">
              {[
                "Maintenance Log",
                "Insurance Copy",
                "Route Assistant",
              ].map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  className="w-full justify-between rounded-md font-black text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-9 text-[10px] uppercase tracking-widest"
                >
                  {item}{" "}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </Card>

          <Card className="border shadow-sm rounded-lg bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Trip History
              </h4>
            </div>
            <div className="p-4 space-y-3">
              {tripHistory.length > 0 ? (
                tripHistory.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                        <HistoryIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 leading-none uppercase tracking-widest">
                          {trip.vehicles
                            ?.plate_number ||
                            "TRIP-" +
                              trip.id.slice(0, 4)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                          {new Date(
                            trip.end_time ||
                              trip.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase bg-white border border-emerald-100 px-1.5 py-0.5 rounded">
                      Done
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    No history
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
