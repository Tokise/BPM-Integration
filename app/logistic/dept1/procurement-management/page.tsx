"use client";

import { useState } from "react";
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
                24
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
                08
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
                Completed Today
              </p>
              <p className="text-2xl font-black text-slate-900">
                12
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
                    Est. Delivery
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <PORow
                    key={i}
                    index={i}
                    supabase={supabase}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PORow({
  index: i,
  supabase,
}: {
  index: number;
  supabase: any;
}) {
  const [loadingStatus, setLoadingStatus] =
    useState(false);
  const status =
    i % 3 === 0
      ? "Awaiting Vendor"
      : "In Transit";
  const arrived = i === 1; // Example: First one is ready to complete

  const handleCompleteArrival = async (
    id: string,
    productId: string,
    qty: number,
  ) => {
    setLoadingStatus(true);
    const toastId = toast.loading(
      "Updating inventory...",
    );
    try {
      const { error } = await supabase.rpc(
        "increment_stock",
        {
          product_id: productId,
          qty: qty,
        },
      );
      if (error) throw error;
      toast.success(
        "Inventory updated successfully!",
        { id: toastId },
      );
    } catch (error: any) {
      toast.error(
        error.message || "Failed to update stock",
        {
          id: toastId,
        },
      );
    } finally {
      setLoadingStatus(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-6">
        <div className="font-bold text-slate-900">
          #PO-2026-00{i}
        </div>
        <div className="text-[10px] text-slate-400 font-bold">
          Standard Request
        </div>
      </td>
      <td className="p-6 font-medium text-slate-700">
        Global Tech Solutions Corp.
      </td>
      <td className="p-6">
        <span
          className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${
            arrived
              ? "bg-green-50 text-green-600"
              : i % 3 === 0
                ? "bg-amber-50 text-amber-600"
                : "bg-blue-50 text-blue-600"
          }`}
        >
          {arrived ? "Arrived" : status}
        </span>
      </td>
      <td className="p-6 text-sm text-slate-500">
        Feb {15 + i}, 2026
      </td>
      <td className="p-6 text-right">
        {arrived ? (
          <Button
            disabled={loadingStatus}
            onClick={() =>
              handleCompleteArrival(
                `PO-${i}`,
                "PRODUCT_ID",
                100,
              )
            }
            className="h-9 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4"
          >
            Receive Stock
          </Button>
        ) : (
          <span className="font-black text-slate-900 italic">
            DDP
          </span>
        )}
      </td>
    </tr>
  );
}
