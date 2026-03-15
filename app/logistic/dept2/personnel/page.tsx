"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  Phone,
  MapPin,
  Star,
  UserPlus,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/utils/supabase/client";
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
import Link from "next/link";
import { cn } from "@/lib/utils";

type DriverProfile = {
  id: string;
  full_name: string | null;
  tripCount?: number;
  rating?: number;
};

export default function PersonnelPage() {
  const supabase = createClient();
  const router = useRouter();
  const [drivers, setDrivers] = useState<
    DriverProfile[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    fetchDriversAndStats();
  }, []);

  const fetchDriversAndStats = async () => {
    setLoading(true);

    // Step 1: Get the role_id for logistic2_driver
    const { data: roleData } = await supabase
      .schema("bpm-anec-global")
      .from("roles")
      .select("id")
      .eq("name", "logistic2_driver")
      .single();

    if (!roleData) {
      setLoading(false);
      return;
    }

    // Step 2: Get profiles with that role_id + reservations
    const [profilesRes, reservationsRes] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id, full_name")
          .eq("role_id", roleData.id),
        supabase
          .schema("bpm-anec-global")
          .from("vehicle_reservations")
          .select("driver_id, status")
          .eq("status", "confirmed"),
      ]);

    const potentialDrivers =
      profilesRes.data || [];
    const completedTrips =
      reservationsRes.data || [];

    const enhancedDrivers = potentialDrivers
      .map((driver) => {
        const driverTrips = completedTrips.filter(
          (t) => t.driver_id === driver.id,
        ).length;
        const calculatedRating =
          driverTrips > 0
            ? Math.min(
                5.0,
                4.2 + driverTrips * 0.1,
              )
            : 0;
        return {
          ...driver,
          tripCount: driverTrips,
          rating: Number(
            calculatedRating.toFixed(1),
          ),
        };
      })
      .sort(
        (a, b) =>
          (b.tripCount || 0) - (a.tripCount || 0),
      );

    setDrivers(enhancedDrivers);
    setLoading(false);
  };


  const getInitials = (name: string | null) => {
    if (!name || name.trim() === "") return "DP";
    const parts = name.split(" ");
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
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
              Personnel
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Delivery Personnel
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Monitor active drivers & delivery
            performance • Dept 2
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchDriversAndStats}
            className="h-10 w-10 p-0 rounded-lg border-slate-200"
          >
            <Truck className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>
      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white mt-8">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {["Driver", "ID Reference", "Trips", "Rating", "Status", "Actions"].map((h) => (
                    <th key={h} className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-10 bg-slate-50/10" />
                    </tr>
                  ))
                ) : drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <tr 
                      key={driver.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setIsSheetOpen(true);
                      }}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 uppercase">
                            {getInitials(driver.full_name)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 capitalize tracking-tight text-sm">
                              <PrivacyMask value={driver.full_name || "Unknown Driver"} />
                            </p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Authorized Personnel
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-mono text-xs text-slate-500">
                          <PrivacyMask value={driver.id.slice(0, 12)} />
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-slate-300" />
                          <span className="font-black text-slate-900 text-sm">{driver.tripCount || 0}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <Star className={cn("h-3.5 w-3.5", driver.rating ? "text-amber-500 fill-amber-500" : "text-slate-200")} />
                          <span className="font-black text-slate-900 text-sm">{driver.rating ? `${driver.rating}` : "—"}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded border border-emerald-100 uppercase tracking-widest inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900"
                        >
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      No drivers found in system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-white border-l p-0 sm:max-w-md overflow-y-auto">
          {selectedDriver && (
            <div className="h-full flex flex-col">
              <div className="p-8 bg-slate-900 text-white">
                <div className="h-20 w-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black mb-6">
                  {getInitials(selectedDriver.full_name)}
                </div>
                <h2 className="text-3xl font-black tracking-tighter">
                  <PrivacyMask value={selectedDriver.full_name || "Driver Profile"} />
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                  ID: {selectedDriver.id.slice(0, 12).toUpperCase()}
                </p>
              </div>

              <div className="p-8 space-y-8 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Trips</p>
                    <p className="text-2xl font-black text-slate-900">{selectedDriver.tripCount || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                    <p className="text-2xl font-black text-slate-900">{selectedDriver.rating || "—"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold">+63 9XX XXX XXXX</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">Metro Manila, Philippines</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <Button 
                    onClick={() => router.push("/logistic/dept2/vrds")}
                    className="w-full h-12 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-slate-200"
                  >
                    Access Driver Logs
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
