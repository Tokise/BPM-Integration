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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept1"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Project Logistic Tracking
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Project Logistic Tracking
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            FBS Inbound Approval Gate & Monitoring
            • Dept 1
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAll}
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-lg h-10 px-4 bg-white hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            className="border shadow-sm rounded-lg overflow-hidden bg-white group"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                    s.color === "amber" &&
                      "bg-amber-50 text-amber-600 border border-amber-100",
                    s.color === "blue" &&
                      "bg-blue-50 text-blue-600 border border-blue-100",
                    s.color === "purple" &&
                      "bg-purple-50 text-purple-600 border border-purple-100",
                    s.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600 border border-emerald-100",
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {loading ? "..." : s.val}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() =>
                setActiveTab("fbs_pickups")
              }
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "fbs_pickups"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              FBS Pickups
              {fbsPickups.filter(
                (f) => f.status === "requested",
              ).length > 0 && (
                <span className="ml-2 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px]">
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
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "fbs_deliveries"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              FBS Deliveries
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Filter by merchant..."
              className="pr-10 h-9 rounded-lg bg-white border-slate-200 font-bold text-slate-900 text-xs"
            />
          </div>
        </div>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse text-[10px]">
                Loading pipeline data...
              </div>
            ) : fbsPickups.filter((f) => {
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
                if (activeTab === "fbs_pickups")
                  return f.status === "requested";
                return [
                  "fbs_forwarded_to_fleet",
                  "fbs_dispatched",
                  "fbs_in_transit",
                  "pending_inbound",
                ].includes(f.status);
              }).length > 0 ? (
              fbsPickups
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
                  if (!matchesSearch)
                    return false;
                  if (activeTab === "fbs_pickups")
                    return (
                      f.status === "requested"
                    );
                  return [
                    "fbs_forwarded_to_fleet",
                    "fbs_dispatched",
                    "fbs_in_transit",
                    "pending_inbound",
                  ].includes(f.status);
                })
                .map((fbs) => (
                  <div
                    key={fbs.id}
                    className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 group-hover:bg-white transition-colors shadow-sm">
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
                          <Package className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs font-black text-slate-900 uppercase">
                            {fbs.products?.shops
                              ?.name ||
                              "FBS Merchant"}
                          </h3>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                              fbs.status ===
                                "requested"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : fbs.status ===
                                    "pending_inbound"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-blue-50 text-blue-600 border-blue-100",
                            )}
                          >
                            {fbs.status.replace(
                              /_/g,
                              " ",
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {fbs.products?.name} •
                          Quantity: {fbs.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {activeTab ===
                        "fbs_deliveries" && (
                        <div className="flex gap-8">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                              Vehicle
                            </p>
                            <p className="text-[10px] font-black text-slate-600 uppercase mt-0.5">
                              {fbs.vehicles
                                ?.plate_number ||
                                "TBD"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                              Tracking
                            </p>
                            <p className="text-[10px] font-black text-blue-600 uppercase mt-0.5">
                              {fbs.status.replace(
                                /_/g,
                                " ",
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {activeTab ===
                        "fbs_pickups" && (
                        <Button
                          onClick={() =>
                            handleForwardToFleet(
                              fbs.id,
                            )
                          }
                          className="h-9 rounded-lg font-black bg-slate-900 text-white hover:bg-slate-800 text-[10px] uppercase tracking-widest px-6 shadow-sm"
                        >
                          Forward to Fleet
                          <ChevronRight className="h-3 w-3 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-20 text-center">
                <Truck className="h-12 w-12 text-slate-100 mx-auto mb-2" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  No active records found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
