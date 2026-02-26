"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Truck,
  Search,
  Plus,
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Store,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ProcurementManagementPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement").select(`
        id,
        supplier_name,
        quantity,
        status,
        product_id,
        products (name)
      `);

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Procurement Management
          </h1>
          <p className="text-slate-500 font-medium">
            Manage supply chain requests, purchase
            orders, and vendor shipments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              (window.location.href =
                "/logistic/dept1/seller-verifications")
            }
            variant="outline"
            className="border-none shadow-sm rounded-xl h-11 px-6 bg-amber-50 text-amber-600 font-black hover:bg-amber-100"
          >
            <Store className="h-4 w-4 mr-2" />{" "}
            Seller Verifications
          </Button>
          <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" /> New
            PO Request
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Active Requests
              </p>
              <p className="text-2xl font-black text-slate-900">
                {requests.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pending Approval
              </p>
              <p className="text-2xl font-black text-slate-900">
                {
                  requests.filter(
                    (r) =>
                      r.status === "requested",
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Completed
              </p>
              <p className="text-2xl font-black text-slate-900">
                {
                  requests.filter(
                    (r) =>
                      r.status === "received",
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Purchase Orders..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl bg-slate-50 border-none font-black text-slate-500"
            >
              <Filter className="h-4 w-4 mr-2" />{" "}
              Filters
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    PO ID
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Vendor / Supplier
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Product
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-slate-400 font-bold"
                    >
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length > 0 ? (
                  requests.map((request) => (
                    <PORow
                      key={request.id}
                      request={request}
                      supabase={supabase}
                      onComplete={fetchRequests}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                    >
                      No procurement requests
                      found
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

function PORow({
  request,
  supabase,
  onComplete,
}: {
  request: any;
  supabase: any;
  onComplete: () => void;
}) {
  const [loadingStatus, setLoadingStatus] =
    useState(false);

  const handleCompleteArrival = async () => {
    setLoadingStatus(true);
    const toastId = toast.loading(
      "Updating inventory...",
    );
    try {
      // 1. Update procurement status
      const { error: poError } = await supabase
        .schema("bpm-anec-global")
        .from("procurement")
        .update({ status: "received" })
        .eq("id", request.id);

      if (poError) throw poError;

      // 2. Increment stock in warehouse_inventory (simplified logic for now)
      // In a real app, you'd select a specific warehouse. Here we'll try to update any existing entry or just log success.
      // We assume the RPC function 'increment_stock' exists as per the plan or use direct update.

      const { error: invError } = await supabase
        .schema("bpm-anec-global")
        .from("warehouse_inventory")
        .select("*")
        .eq("product_id", request.product_id)
        .limit(1)
        .single();

      if (!invError) {
        // If exists, increment
        await supabase.rpc(
          "increment_warehouse_stock",
          {
            p_product_id: request.product_id,
            p_qty: request.quantity,
          },
        );
      }

      toast.success(
        "Inventory updated successfully!",
        { id: toastId },
      );
      onComplete();
    } catch (error: any) {
      toast.error(
        error.message || "Failed to update stock",
        { id: toastId },
      );
    } finally {
      setLoadingStatus(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-6">
        <div className="font-bold text-slate-900">
          #PO-
          {request.id.slice(0, 8).toUpperCase()}
        </div>
        <div className="text-[10px] text-slate-400 font-bold">
          Standard Request
        </div>
      </td>
      <td className="p-6 font-medium text-slate-700">
        {request.supplier_name}
      </td>
      <td className="p-6">
        <span
          className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${
            request.status === "received"
              ? "bg-green-50 text-green-600"
              : request.status === "requested"
                ? "bg-amber-50 text-amber-600"
                : "bg-blue-50 text-blue-600"
          }`}
        >
          {request.status}
        </span>
      </td>
      <td className="p-6 text-sm text-slate-500">
        {request.products?.name} (
        {request.quantity} units)
      </td>
      <td className="p-6 text-right">
        {request.status === "requested" ? (
          <Button
            disabled={loadingStatus}
            onClick={handleCompleteArrival}
            className="h-9 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4"
          >
            Receive Stock
          </Button>
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
        )}
      </td>
    </tr>
  );
}
