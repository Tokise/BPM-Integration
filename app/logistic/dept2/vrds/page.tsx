"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bookmark,
  Calendar,
  ChevronRight,
  Clock,
  Truck,
  Plus,
  ArrowRight,
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

type Vehicle = {
  id: string;
  plate_number: string;
  vehicle_type: string;
  status: string;
};
type Driver = { id: string; full_name: string };

export default function VRDSPage() {
  const supabase = createClient();

  const [reservations, setReservations] =
    useState<any[]>([]);
  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([]);
  const [drivers, setDrivers] = useState<
    Driver[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState("");
  const [selectedDriver, setSelectedDriver] =
    useState("");
  const [purpose, setPurpose] = useState("");
  const [resDate, setResDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch active reservations, available vehicles, and all drivers
    const [resData, vehData, driverData] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("vehicle_reservations")
          .select(
            `
        id, reservation_date, purpose, status,
        vehicles (plate_number, vehicle_type),
        profiles (full_name)
      `,
          )
          .order("reservation_date", {
            ascending: true,
          }),
        supabase
          .schema("bpm-anec-global")
          .from("vehicles")
          .select("*")
          .eq("status", "available"),
        supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id, full_name")
          .eq("role", "driver"),
      ]);

    if (resData.data)
      setReservations(resData.data);
    if (vehData.data) setVehicles(vehData.data);
    if (driverData.data)
      setDrivers(driverData.data);

    setLoading(false);
  };

  const handleBookReservation = async () => {
    if (
      !selectedVehicle ||
      !selectedDriver ||
      !purpose ||
      !resDate
    ) {
      toast.error("Missing Fields", {
        description:
          "Please fill out all reservation details.",
      });
      return;
    }

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("vehicle_reservations")
      .insert({
        vehicle_id: selectedVehicle,
        driver_id: selectedDriver,
        reservation_date: resDate,
        purpose: purpose,
        status: "confirmed",
      });

    if (error) {
      toast.error("Booking Failed", {
        description: error.message,
      });
    } else {
      toast.success("Dispatch Scheduled", {
        description:
          "Vehicle reservation confirmed.",
      });

      // Mark vehicle as 'in-use' (optional logic for stricter flow)
      await supabase
        .schema("bpm-anec-global")
        .from("vehicles")
        .update({ status: "in-use" })
        .eq("id", selectedVehicle);

      setIsModalOpen(false);
      setPurpose("");
      setResDate("");
      setSelectedVehicle("");
      setSelectedDriver("");
      fetchData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Vehicle Reservation (VRDS)
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Coordinate vehicle dispatch &
            assignments
          </p>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-black/10 hover:bg-slate-800 hover:scale-[1.02] transition-transform">
              <Plus className="h-4 w-4 mr-2" />{" "}
              Book Dispatch
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                Schedule Dispatch
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Assign an asset & driver
              </p>
            </DialogHeader>
            <div className="space-y-4 pt-4 text-slate-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Select Vehicle
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) =>
                      setSelectedVehicle(
                        e.target.value,
                      )
                    }
                    className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold mt-1 px-4 outline-none appearance-none"
                  >
                    <option value="" disabled>
                      Choose an asset...
                    </option>
                    {vehicles.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                      >
                        {v.plate_number} (
                        {v.vehicle_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                    Select Driver
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) =>
                      setSelectedDriver(
                        e.target.value,
                      )
                    }
                    className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold mt-1 px-4 outline-none appearance-none"
                  >
                    <option value="" disabled>
                      Assign driver...
                    </option>
                    {drivers.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                      >
                        {d.full_name ||
                          "Unknown Profile"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                  Purpose / Route
                </label>
                <Input
                  value={purpose}
                  onChange={(e) =>
                    setPurpose(e.target.value)
                  }
                  placeholder="e.g. Regional Delivery Route B"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                  Reservation Date
                </label>
                <Input
                  type="datetime-local"
                  value={resDate}
                  onChange={(e) =>
                    setResDate(e.target.value)
                  }
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1 w-full"
                />
              </div>

              <Button
                onClick={handleBookReservation}
                className="w-full h-12 rounded-xl font-black bg-primary text-black mt-4 hover:scale-[1.02] transition-transform"
              >
                Confirm Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black px-2 mt-4 text-slate-900 border-b-2 border-primary inline-block pb-1">
            Upcoming Dispatches
          </h2>

          <div className="grid gap-4 mt-4">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse bg-slate-50 rounded-3xl">
                Loading schedule...
              </div>
            ) : reservations.length > 0 ? (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-[32px] p-6 shadow-2xl shadow-slate-100/50 flex flex-col md:flex-row gap-6 md:items-center group border border-transparent hover:border-slate-100 transition-colors"
                >
                  <div className="h-20 w-20 rounded-2xl bg-slate-900 flex flex-col items-center justify-center flex-shrink-0 text-white shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-transform">
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-50">
                      Date
                    </span>
                    <span className="text-xl font-black leading-none mt-1">
                      {res.reservation_date
                        ? new Date(
                            res.reservation_date,
                          ).getDate()
                        : "--"}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-slate-900 capitalize tracking-tight">
                        {res.purpose}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${res.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-sm font-medium">
                      <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <Truck className="h-4 w-4 text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {res.vehicles
                            ?.plate_number ||
                            "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <Bookmark className="h-4 w-4 text-slate-400" />
                        <span className="font-bold text-slate-700 truncate max-w-[120px]">
                          {res.profiles
                            ?.full_name ||
                            "Pending Driver"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 md:col-span-1 col-span-2 px-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs uppercase font-bold tracking-widest">
                          {res.reservation_date
                            ? new Date(
                                res.reservation_date,
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute:
                                    "2-digit",
                                },
                              )
                            : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all shrink-0"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-20 text-center rounded-[32px] bg-slate-50 border border-slate-100 border-dashed">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  No upcoming dispatches
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black px-2 mt-4 text-slate-900 border-b-2 border-slate-200 inline-block pb-1">
            Fleet Overview
          </h2>
          <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white p-8">
            <div className="space-y-8">
              {[
                {
                  label: "Available Vehicles",
                  val: vehicles.length,
                  total: 15,
                  color: "emerald",
                  icon: Truck,
                },
                {
                  label: "Drivers Ready",
                  val: drivers.length,
                  total: 50,
                  color: "blue",
                  icon: Bookmark,
                },
                {
                  label: "Active Dispatches",
                  val: reservations.filter(
                    (r) =>
                      r.status === "confirmed",
                  ).length,
                  total: 10,
                  color: "amber",
                  icon: Clock,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="space-y-3"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
                      <stat.icon className="h-3 w-3" />{" "}
                      {stat.label}
                    </span>
                    <div className="flex justify-between items-end">
                      <span
                        className={`text-2xl font-black text-${stat.color}-600 leading-none`}
                      >
                        {loading
                          ? "..."
                          : stat.val}
                        <span className="text-xs text-slate-300 ml-1">
                          / {stat.total}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${stat.color}-500 transition-all duration-1000`}
                      style={{
                        width: loading
                          ? "0%"
                          : `${Math.min(100, (stat.val / stat.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
