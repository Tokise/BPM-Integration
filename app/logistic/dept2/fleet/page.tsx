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
  Shield,
  Search,
  Map,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function FleetManagementPage() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("vehicles")
      .select("*");

    if (!error && data) {
      setVehicles(data);
    }
    setLoading(false);
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

  return (
    <div className="space-y-8 text-black animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-blue-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
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
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-amber-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
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
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-green-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
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

      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search vehicles..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium"
            />
          </div>
        </div>
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
                              {
                                vehicle.plate_number
                              }
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
                            className="h-8 rounded-lg font-black text-[10px] uppercase text-primary"
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
                          Register assets in ALMS
                          →
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
    </div>
  );
}
