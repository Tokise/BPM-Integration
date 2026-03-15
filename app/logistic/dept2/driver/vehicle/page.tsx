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
  Shield,
  Fuel,
  Wrench,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function MyVehiclePage() {
  const {
    profile: userProfile,
    loading: userLoading,
  } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] =
    useState<any[]>([]);

  useEffect(() => {
    if (!userLoading && userProfile) {
      fetchVehicleData();
    }
  }, [userProfile, userLoading]);

  const fetchVehicleData = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    try {
      const {
        data: resData,
        error: resError,
      } = await supabase
        .schema("bpm-anec-global")
        .from("vehicle_reservations")
        .select(`*, vehicles:vehicle_id(*)`)
        .eq("driver_id", userProfile.id)
        .eq("status", "confirmed")
        .order("start_time", { ascending: false });

      if (resError) throw resError;
      setReservations(resData || []);
    } catch (error: any) {
      toast.error(
        "Failed to fetch vehicle details",
        {
          description: error.message,
        },
      );
    } finally {
      setLoading(false);
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
              My Vehicle
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none text-balance">
            Equipment Details
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Technical specifications & maintenance
            logs
          </p>
        </div>
      </div>

      {reservations.length === 0 ? (
        <Card className="border shadow-none rounded-lg bg-slate-50/50">
          <CardContent className="py-20 text-center">
            <Car className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
              No Vehicle Assigned
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
              Assigned equipment will appear here
              once dispatched
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {reservations.map((res: any) => {
            const vehicle = res.vehicles;
            if (!vehicle) return null;
            return (
              <div key={res.id} className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Main Info Card */}
                <Card className="border shadow-none rounded-lg overflow-hidden bg-white">
                  <div className="grid md:grid-cols-3">
                    <div className="bg-slate-50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/80 border border-slate-200 rounded text-[8px] font-black uppercase text-slate-500 z-10">
                        {res.purpose || "Active Equipment"}
                      </div>
                      {vehicle.image_url ? (
                        <img
                          src={vehicle.image_url}
                          alt="Vehicle"
                          className="rounded-lg shadow-md max-w-full h-auto object-cover"
                        />
                      ) : (
                        <div className="h-40 w-40 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-inner">
                          <Car className="h-16 w-16 text-slate-100" />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 p-8 space-y-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Identification
                          </p>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
                            <PrivacyMask
                              value={
                                vehicle.plate_number
                              }
                            />
                          </h2>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          vehicle.status === 'active' || vehicle.status === 'available' ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
                        )}>
                          {vehicle.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Model/Type
                          </p>
                          <p className="text-sm font-black text-slate-700 uppercase mt-1">
                            {vehicle.vehicle_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Capacity
                          </p>
                          <p className="text-sm font-black text-slate-700 uppercase mt-1">
                            N/A
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Fuel Type
                          </p>
                          <p className="text-sm font-black text-slate-700 uppercase mt-1">
                            Diesel
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Assigned At
                          </p>
                          <p className="text-sm font-black text-slate-700 uppercase mt-1 tracking-tight">
                            {new Date(res.start_time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Quick Metrics */}
                  <Card className="border shadow-none rounded-lg bg-white">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                          <Fuel className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Fuel Level
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm font-black text-slate-900 uppercase">
                              75%
                            </p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                              Approx 450km
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Next Service
                          </p>
                          <p className="text-sm font-black text-slate-900 uppercase mt-1">
                            In 2,400 km
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Insurance
                          </p>
                          <p className="text-sm font-black text-slate-900 uppercase mt-1">
                            Active
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Logs Table */}
                  <Card className="md:col-span-2 border shadow-none rounded-lg bg-white overflow-hidden">
                    <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Equipment Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-50">
                        {[
                          {
                            date: "Yesterday",
                            event:
                              "Standard Inspection",
                            status: "Passed",
                            type: "Safety",
                          },
                          {
                            date: "3 days ago",
                            event:
                              "Tire Pressure Check",
                            status: "Completed",
                            type: "Maint",
                          },
                          {
                            date: "1 week ago",
                            event: "Brake Fluid Top-up",
                            status: "Completed",
                            type: "Maint",
                          },
                        ].map((log, i) => (
                          <div
                            key={i}
                            className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-center w-20 shrink-0">
                                <p className="text-[9px] font-black text-slate-900 uppercase leading-none">
                                  {log.date}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase">
                                  {log.event}
                                </p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-0.5">
                                  {log.type}
                                </p>
                              </div>
                            </div>
                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                              {log.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
