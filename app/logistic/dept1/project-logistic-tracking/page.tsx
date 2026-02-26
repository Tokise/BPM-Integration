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
  Filter,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

export default function ProjectLogisticTrackingPage() {
  const supabase = createClient();
  const [shipments, setShipments] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select(
        `
        id,
        tracking_number,
        status,
        origin_address_id,
        destination_address_id,
        estimated_delivery
      `,
      )
      .limit(5);

    if (!error && data) {
      setShipments(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Project Logistic Tracking
          </h1>
          <p className="text-slate-500 font-medium">
            End-to-end monitoring for large-scale
            project materials and deployments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-11 border-slate-200 font-bold"
          >
            Export Logs
          </Button>
          <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
            Create Project Hub
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Enter Project ID or Shipment #"
            className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-medium"
          />
        </div>
        <Button
          variant="ghost"
          className="h-11 px-4 rounded-2xl text-slate-500 font-black"
        >
          <Filter className="h-4 w-4 mr-2" />{" "}
          Quick Filter
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">
            Loading shipments...
          </div>
        ) : shipments.length > 0 ? (
          shipments.map((shipment, i) => (
            <Card
              key={shipment.id}
              className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group bg-white border border-slate-50"
            >
              <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Layers className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-slate-900">
                        Shipment #
                        {shipment.tracking_number ||
                          shipment.id
                            .slice(0, 8)
                            .toUpperCase()}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase ${
                          shipment.status ===
                          "delivered"
                            ? "bg-green-50 text-green-600"
                            : shipment.status ===
                                "pending"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {shipment.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      {shipment.id} • Estimated:{" "}
                      {shipment.estimated_delivery
                        ? new Date(
                            shipment.estimated_delivery,
                          ).toLocaleDateString()
                        : "TBD"}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-slate-400" />
                    <div className="text-xs font-bold text-slate-600">
                      En-route to Destination
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-slate-400" />
                    <div className="text-xs font-bold text-slate-600">
                      Standard Package
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div className="text-xs font-bold text-slate-600">
                      Regional Sorting Center
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      className="text-primary font-black h-auto p-0 flex items-center group/btn"
                    >
                      Full Details{" "}
                      <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="p-20 bg-white rounded-3xl text-center border border-dashed border-slate-200">
            <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
              No active shipments found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
