"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Box,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function ReceiveInboundPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isProcessing, setIsProcessing] =
    useState(false);
  const [pendingInbound, setPendingInbound] =
    useState<any[]>([]);
  const [loadingPending, setLoadingPending] =
    useState(true);

  useEffect(() => {
    fetchPendingInbound();
  }, []);

  const fetchPendingInbound = async () => {
    setLoadingPending(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select(
        `
        id, quantity, created_at, status, product_id,
        products (id, name, barcode, images, shop_id, stock_qty, low_stock_threshold, shops(name))
      `,
      )
      .eq("shipment_type", "fbs_inbound")
      .eq("status", "pending_inbound")
      .order("created_at", { ascending: false });

    if (data) setPendingInbound(data);
    setLoadingPending(false);
  };

  const verifyAndReceive = async (
    procurement: any,
  ) => {
    if (!procurement.products?.id) {
      toast.error(
        "Invalid product data in procurement record",
      );
      return;
    }

    setIsProcessing(true);
    const product = procurement.products;
    const qty = procurement.quantity;

    try {
      // Check if warehouse_inventory entry exists
      const { data: existing } = await supabase
        .schema("bpm-anec-global")
        .from("warehouse_inventory")
        .select("id, quantity")
        .eq("product_id", product.id)
        .limit(1)
        .single();

      let finalQty = qty;

      if (existing) {
        // Update existing
        finalQty = (existing.quantity || 0) + qty;
        await supabase
          .schema("bpm-anec-global")
          .from("warehouse_inventory")
          .update({
            quantity: finalQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Create new entry
        const { data: warehouses } =
          await supabase
            .schema("bpm-anec-global")
            .from("warehouses")
            .select("id")
            .limit(1)
            .single();

        await supabase
          .schema("bpm-anec-global")
          .from("warehouse_inventory")
          .insert({
            product_id: product.id,
            warehouse_id: warehouses?.id || null,
            shop_id: product.shop_id,
            quantity: qty,
          });
      }

      // Update product stock globally to match warehouse state
      await supabase
        .schema("bpm-anec-global")
        .from("products")
        .update({
          stock_qty:
            (product.stock_qty || 0) + qty,
        })
        .eq("id", product.id);

      // We only receive THIS particular shipment record to ensure it is cleared
      await supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .update({ status: "received" })
        .eq("id", procurement.id);

      toast.success("Inbound Received!", {
        description: `${product.name}: +${qty} units. Now ${finalQty} in warehouse.`,
      });

      // Refresh list
      fetchPendingInbound();
    } catch (error: any) {
      toast.error("Error receiving inbound", {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/logistic/dept1">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/logistic/dept1/warehouse">
                Warehouse
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Receive Inbound
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Receive Inbound
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Warehouse Verification & Stock
            Receiving
          </p>
        </div>
      </div>

      <Card className="border shadow-sm rounded-lg p-6 bg-white overflow-hidden w-full">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="h-5 w-5 text-amber-500" />
          <h3 className="font-black text-slate-900 text-lg">
            Active Inbound Queue
          </h3>
        </div>

        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {loadingPending ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-white border border-dashed border-slate-200 animate-pulse">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Loading queue...
              </p>
            </div>
          ) : pendingInbound.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingInbound.map((proc) => (
                <div
                  key={proc.id}
                  className="p-5 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative group"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                      {proc.products
                        ?.images?.[0] ? (
                        <img
                          src={
                            proc.products
                              .images[0]
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Box className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-900 text-base line-clamp-1">
                        {proc.products?.name}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        From:{" "}
                        {proc.products?.shops
                          ?.name || "FBS Retail"}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                        {proc.status.replace(
                          /_/g,
                          " ",
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <p className="text-sm font-black text-slate-700">
                      Qty: {proc.quantity}
                    </p>
                    <Button
                      onClick={() =>
                        verifyAndReceive(proc)
                      }
                      disabled={isProcessing}
                      className="h-9 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white font-bold text-xs shadow-none transition-colors px-6"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify & Receive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4 rounded-3xl bg-white border border-dashed border-slate-200">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                No active inbound shipments
              </p>
              <p className="text-xs font-medium text-slate-400 mt-2">
                When items are dispatched via FBS,
                they will appear here.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
