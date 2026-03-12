"use client";

import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { createDriverProfile } from "@/app/actions/drivers";
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
  const [drivers, setDrivers] = useState<
    DriverProfile[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Add Driver State
  const [isAddOpen, setIsAddOpen] =
    useState(false);
  const [newDriverName, setNewDriverName] =
    useState("");
  const [newDriverEmail, setNewDriverEmail] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    fetchDriversAndStats();
  }, []);

  const fetchDriversAndStats = async () => {
    setLoading(true);

    const [profilesRes, reservationsRes] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id, full_name")
          .eq("role", "driver"),
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

  const handleAddDriver = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!newDriverName || !newDriverEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      "Registering new driver...",
    );
    const res = await createDriverProfile(
      newDriverName,
      newDriverEmail,
    );
    setIsSubmitting(false);

    if (res.success) {
      toast.success(
        "Driver Registered Successfully!",
        { id: toastId },
      );
      setIsAddOpen(false);
      setNewDriverName("");
      setNewDriverEmail("");
      fetchDriversAndStats();
    } else {
      toast.error("Failed to register driver", {
        id: toastId,
        description: res.error,
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name || name.trim() === "") return "DP";
    const parts = name.split(" ");
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 max-w-7xl mx-auto pb-20 p-6">
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
        <Dialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white font-black rounded-lg h-10 px-6 hover:bg-slate-800 transition-colors text-[10px] uppercase tracking-widest">
              <UserPlus className="h-4 w-4 mr-2" />{" "}
              Add Driver Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-lg p-6 bg-white border-slate-200 shadow-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                Register Driver
              </DialogTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Create a new active delivery
                personnel account
              </p>
            </DialogHeader>
            <form
              onSubmit={handleAddDriver}
              className="space-y-4 mt-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Full Name
                </label>
                <Input
                  value={newDriverName}
                  onChange={(e) =>
                    setNewDriverName(
                      e.target.value,
                    )
                  }
                  placeholder="Juan Dela Cruz"
                  className="h-10 rounded-lg bg-slate-50 border-slate-200 px-4 font-bold text-xs"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={newDriverEmail}
                  onChange={(e) =>
                    setNewDriverEmail(
                      e.target.value,
                    )
                  }
                  placeholder="juan@example.com"
                  className="h-10 rounded-lg bg-slate-50 border-slate-200 px-4 font-bold text-xs"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest mt-2"
              >
                {isSubmitting
                  ? "Registering..."
                  : "Create Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map(
            (_, i) => (
              <div
                key={i}
                className="h-64 bg-slate-50 rounded-lg border border-slate-100 animate-pulse"
              />
            ),
          )
        ) : drivers.length > 0 ? (
          drivers.map((driver) => (
            <Card
              key={driver.id}
              className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white hover:border-slate-300 transition-colors"
            >
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-400 uppercase">
                      {getInitials(
                        driver.full_name,
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 capitalize tracking-tight leading-none mb-1 text-sm">
                        <PrivacyMask
                          value={
                            driver.full_name ||
                            "Unknown Driver"
                          }
                        />
                      </h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ID:{" "}
                        <PrivacyMask
                          value={driver.id.slice(
                            0,
                            8,
                          )}
                        />
                      </p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded border border-emerald-100 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />{" "}
                    Active
                  </span>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-slate-300" />
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">
                        Trips
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      {driver.tripCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          driver.rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-200",
                        )}
                      />
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">
                        Rating
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      {driver.rating
                        ? `${driver.rating}/5.0`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 rounded-lg border-slate-200 font-black text-[9px] uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    View Manifest
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-lg hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Phone className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-20 text-center rounded-lg border border-dashed border-slate-200">
            <Users className="h-10 w-10 text-slate-100 mx-auto mb-3" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
              No authorized drivers found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
