"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  MapPin,
  Truck,
  ChevronRight,
  Package,
  Search,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ProjectLogisticTrackingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fbsPickups, setFbsPickups] = useState<
    any[]
  >([]);
  const [activeTab, setActiveTab] = useState(
    "fbs_pickups",
  );

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select(
        `
        id, quantity, status, vehicle_id, product_id,
        products(id, name, shop_id, shops(name), images),
        vehicles:vehicle_id(id, plate_number, vehicle_type, image_url)
      `,
      )
      .eq("shipment_type", "fbs_inbound")
      .in("status", [
        "requested",
        "fbs_forwarded_to_fleet",
        "fbs_dispatched",
        "fbs_in_transit",
        "pending_inbound",
      ])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PLT Fetch Error:", error);
      toast.error("Failed to fetch shipments", {
        description: error.message,
      });
    }

    if (data) {
      setFbsPickups(data);
    }
    setLoading(false);
  };

  const handleForwardToFleet = async (
    shipmentId: string,
  ) => {
    const toastId = toast.loading(
      "Forwarding to Fleet Command...",
    );
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .update({
        status: "fbs_forwarded_to_fleet",
      })
      .eq("id", shipmentId);

    if (error) {
      toast.error("Failed to forward", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        "Forwarded to Fleet Command!",
        { id: toastId },
      );
      fetchAll();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Project Logistic Tracking
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            FBS Inbound Approval Gate & Monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAll}
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-4"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Pending Approvals",
            val: fbsPickups.filter(
              (f) => f.status === "requested",
            ).length,
            icon: Clock,
            color: "amber",
          },
          {
            label: "In Transit",
            val: fbsPickups.filter(
              (s) =>
                s.status === "fbs_in_transit",
            ).length,
            icon: MapPin,
            color: "blue",
          },
          {
            label: "Fleet Dispatched",
            val: fbsPickups.filter(
              (s) =>
                s.status === "fbs_dispatched",
            ).length,
            icon: Truck,
            color: "purple",
          },
          {
            label: "Arrived at WH",
            val: fbsPickups.filter(
              (s) =>
                s.status === "pending_inbound",
            ).length,
            icon: CheckCircle2,
            color: "emerald",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white relative group overflow-hidden"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${s.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8 relative">
              <div
                className={`h-12 w-12 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-4`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-4 bg-white p-2 flex-1 rounded-3xl shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by merchant or product..."
              className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-medium"
            />
          </div>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0 overflow-x-auto">
          <button
            onClick={() =>
              setActiveTab("fbs_pickups")
            }
            className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "fbs_pickups"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            FBS Pickups
            {fbsPickups.filter(
              (f) => f.status === "requested",
            ).length > 0 && (
              <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded-md text-[10px]">
                {
                  fbsPickups.filter(
                    (f) =>
                      f.status === "requested",
                  ).length
                }
              </span>
            )}
          </button>
          <button
            onClick={() =>
              setActiveTab("fbs_deliveries")
            }
            className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "fbs_deliveries"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            FBS Deliveries
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid gap-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
            Loading data...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {fbsPickups
              .filter((f) => {
                const productName =
                  f.products?.name?.toLowerCase() ||
                  "";
                const shopOwnerName =
                  f.products?.shops?.name?.toLowerCase() ||
                  "";
                const searchLower =
                  search.toLowerCase();

                const matchesSearch =
                  productName.includes(
                    searchLower,
                  ) ||
                  shopOwnerName.includes(
                    searchLower,
                  );

                if (!matchesSearch) return false;

                if (activeTab === "fbs_pickups") {
                  return f.status === "requested";
                } else {
                  return [
                    "fbs_forwarded_to_fleet",
                    "fbs_dispatched",
                    "fbs_in_transit",
                    "pending_inbound",
                  ].includes(f.status);
                }
              })
              .map((fbs) => (
                <Card
                  key={fbs.id}
                  className="border-none shadow-lg rounded-[40px] overflow-hidden bg-white relative group"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="h-24 w-24 rounded-[32px] bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner">
                        {fbs.products
                          ?.images?.[0] ? (
                          <img
                            src={
                              fbs.products
                                .images[0]
                            }
                            className="h-full w-full object-cover"
                            alt="Product"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-2xl font-black text-slate-900">
                                {fbs.products
                                  ?.shops?.name ||
                                  "FBS Merchant"}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  fbs.status ===
                                  "requested"
                                    ? "bg-amber-50 text-amber-600"
                                    : fbs.status ===
                                        "pending_inbound"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                {fbs.status.replace(
                                  /_/g,
                                  " ",
                                )}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-400">
                              {fbs.products?.name}{" "}
                              • Qty:{" "}
                              {fbs.quantity}
                            </p>
                          </div>

                          {activeTab ===
                            "fbs_pickups" && (
                            <Button
                              onClick={() =>
                                handleForwardToFleet(
                                  fbs.id,
                                )
                              }
                              className="rounded-2xl font-black text-xs bg-indigo-500 hover:bg-indigo-600 text-white h-12 px-8 shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1"
                            >
                              Forward to Fleet
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>

                        {activeTab ===
                          "fbs_deliveries" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Assigned Vehicle
                              </p>
                              <p className="font-bold text-slate-700 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-slate-400" />
                                {fbs.vehicles
                                  ?.plate_number ||
                                  "TBD"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Tracking Updates
                              </p>
                              <div className="flex items-center gap-2">
                                <RefreshCcw
                                  className={`h-4 w-4 ${
                                    fbs.status ===
                                    "requested"
                                      ? "text-slate-200"
                                      : "text-blue-500 animate-spin-slow"
                                  }`}
                                />
                                <p className="font-bold text-blue-600">
                                  {fbs.status ===
                                  "requested"
                                    ? "Awaiting Action"
                                    : fbs.status ===
                                        "fbs_forwarded_to_fleet"
                                      ? "Fleet Assigning..."
                                      : fbs.status.replace(
                                          /_/g,
                                          " ",
                                        )}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Next Junction
                              </p>
                              <p className="font-bold text-slate-700">
                                {fbs.status ===
                                "pending_inbound"
                                  ? "Arrived - Warehouse Verify"
                                  : "Fleet Monitoring"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

            {fbsPickups.filter((f) => {
              if (activeTab === "fbs_pickups") {
                return f.status === "requested";
              }
              return [
                "fbs_forwarded_to_fleet",
                "fbs_dispatched",
                "fbs_in_transit",
                "pending_inbound",
              ].includes(f.status);
            }).length === 0 && (
              <div className="p-20 bg-white rounded-[40px] text-center border border-dashed border-slate-200">
                <Truck className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">
                  No active records in this
                  pipeline
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
