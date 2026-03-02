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

    // Fetch profiles with driver role and all completed reservations
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

    // Map trips to drivers and calculate stats
    const enhancedDrivers = potentialDrivers
      .map((driver) => {
        const driverTrips = completedTrips.filter(
          (t) => t.driver_id === driver.id,
        ).length;
        // Simulate rating based on trip count, min 4.2, max 5.0
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
      ); // Sort by most trips

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Delivery Personnel
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Monitor active drivers & delivery
            performance
          </p>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-black/10 hover:bg-slate-800 hover:scale-[1.02] transition-transform">
              <UserPlus className="h-4 w-4 mr-2" />{" "}
              Add Driver Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                Register Driver
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Create a new active delivery
                personnel account
              </p>
            </DialogHeader>
            <form
              onSubmit={handleAddDriver}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
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
                  className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
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
                  className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 mt-4"
              >
                {isSubmitting
                  ? "Registering..."
                  : "Create Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center animate-pulse">
            <div className="h-12 w-12 bg-slate-100 rounded-2xl mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
              Loading personnel records...
            </p>
          </div>
        ) : drivers.length > 0 ? (
          drivers.map((driver) => (
            <Card
              key={driver.id}
              className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white hover:scale-[1.01] transition-transform group relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[80px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity" />
              <CardContent className="p-8 space-y-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center text-xl font-black text-slate-400 group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
                      {getInitials(
                        driver.full_name,
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 capitalize tracking-tight leading-none mb-1">
                        {driver.full_name ||
                          "Unknown Driver"}
                      </h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ID:{" "}
                        {driver.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />{" "}
                    Active
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Truck className="h-4 w-4 text-slate-400" />
                      <span className="text-xs uppercase font-bold tracking-widest">
                        Completed Trips
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">
                      {driver.tripCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Star
                        className={`h-4 w-4 ${driver.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                      />
                      <span className="text-xs uppercase font-bold tracking-widest">
                        Performance
                      </span>
                    </div>
                    <span className="font-black text-slate-900">
                      {driver.rating
                        ? `${driver.rating} / 5.0`
                        : "Unrated"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-slate-200 font-bold bg-white hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    View Manifest
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-12 w-12 p-0 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
                  >
                    <Phone className="h-5 w-5 text-slate-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-20 text-center rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/50">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
              No authorized drivers found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
