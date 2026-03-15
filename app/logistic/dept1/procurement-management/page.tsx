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
  ShoppingBag,
  CheckCircle2,
  Store,
  AlertCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Activity } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRef } from "react";

export default function ProcurementManagementPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] =
    useState("orders"); // Only "orders" now
  const [lowStockItems, setLowStockItems] =
    useState<any[]>([]);
  const generatingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRequests();
      await fetchLowStockItems();
      setLoading(false);
    };
    init();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .select(
        `
        id,
        supplier_name,
        quantity,
        status,
        product_id,
        shop_id,
        items,
        products (name)
      `,
      );

    if (!error && data) {
      setRequests(data);
    }
  };

  const fetchLowStockItems = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    try {
      const { data } = await supabase
        .schema("bpm-anec-global")
        .from("warehouse_inventory").select(`
          id,
          quantity,
          product_id,
          shop_id,
          products (id, name, low_stock_threshold, shop_id, shops(id, name))
        `);

      if (data) {
        const low = data.filter(
          (i: any) =>
            i.quantity <=
            ((Array.isArray(i.products)
              ? i.products[0]?.low_stock_threshold
              : i.products
                  ?.low_stock_threshold) || 10),
        );
        setLowStockItems(low);

        if (low.length === 0) return;

        // Group low stock by seller
        const bySeller: Record<string, any[]> =
          {};
        low.forEach((item) => {
          const prod = Array.isArray(
            item.products,
          )
            ? item.products[0]
            : item.products;
          const sId =
            item.shop_id || prod?.shop_id;
          if (!sId) return;
          if (!bySeller[sId]) bySeller[sId] = [];
          bySeller[sId].push({
            product_id: item.product_id,
            name: prod?.name,
            quantity:
              (prod?.low_stock_threshold || 10) *
              2,
          });
        });

        let createdAny = false;
        for (const sId in bySeller) {
          // Check for existing DRAFT or REQUESTED PO for this seller in DB
          const { data: existingPO } =
            await supabase
              .schema("bpm-anec-global")
              .from("procurement")
              .select("id")
              .eq("shop_id", sId)
              .in("status", [
                "draft_po",
                "requested",
                "approved",
                "fbs_pickup_requested",
                "fbs_forwarded_to_fleet",
              ])
              .limit(1);

          if (
            !existingPO ||
            existingPO.length === 0
          ) {
            // Also check current requests state to avoid double insertion if fetchRequests is slow or outdated
            const alreadyInState = requests.some(
              (r) =>
                r.shop_id === sId &&
                [
                  "draft_po",
                  "requested",
                  "approved",
                ].includes(r.status),
            );
            if (alreadyInState) continue;

            const sellerItems = bySeller[sId];
            const foundLow = low.find(
              (l: any) =>
                (l.shop_id ||
                  (Array.isArray(l.products)
                    ? l.products[0]?.shop_id
                    : l.products?.shop_id)) ===
                sId,
            );
            const lowProd = Array.isArray(
              foundLow?.products,
            )
              ? foundLow?.products[0]
              : foundLow?.products;
            const sellerName =
              (Array.isArray(lowProd?.shops)
                ? lowProd.shops[0]?.name
                : (lowProd?.shops as any)
                    ?.name) || "Global Store";

            await supabase
              .schema("bpm-anec-global")
              .from("procurement")
              .insert({
                shop_id: sId,
                supplier_name: sellerName,
                status: "draft_po",
                items: { list: sellerItems },
                quantity: sellerItems.reduce(
                  (acc, current) =>
                    acc + current.quantity,
                  0,
                ),
              });
            createdAny = true;
          }
        }

        if (createdAny) fetchRequests();
      }
    } finally {
      generatingRef.current = false;
    }
  };

  const handleForwardToLogistics2 = async (
    request: any,
  ) => {
    const toastId = toast.loading(
      "Forwarding to Logistics 2 (Fleet)...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .insert({
        product_id: request.product_id,
        quantity: request.quantity,
        items: request.items, // Support consolidated items
        shipment_type: "fbs_inbound",
        status: "fbs_forwarded_to_fleet",
      });

    if (error) {
      toast.error("Forwarding failed", {
        id: toastId,
        description: error.message,
      });
    } else {
      // Mark procurement as forwarded or similar
      await supabase
        .schema("bpm-anec-global")
        .from("procurement")
        .update({
          status: "fbs_forwarded_to_fleet",
        })
        .eq("id", request.id);

      toast.success(
        "FBS Pickup forwarded to Fleet!",
        {
          id: toastId,
          description:
            "Logistics 2 can now assign a driver.",
        },
      );
      fetchRequests();
    }
  };

  const handleApproveQuotation = async (
    request: any,
  ) => {
    const toastId = toast.loading(
      "Approving quotation & generating PO...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "approved" })
      .eq("id", request.id);

    if (error) {
      toast.error("Approval failed", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        "Quotation Approved — PO Generated!",
        {
          id: toastId,
          description: `Supplier ${request.supplier_name} notified. Delivery schedule pending.`,
        },
      );
      fetchRequests();
      setActiveTab("orders");
    }
  };

  const handleRejectQuotation = async (
    request: any,
  ) => {
    const toastId = toast.loading(
      "Rejecting quotation...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .update({ status: "rejected" })
      .eq("id", request.id);

    if (!error) {
      toast.info(
        "Quotation Rejected — seeking alternative supplier",
        { id: toastId },
      );
      fetchRequests();
    }
  };

  const statusCounts = {
    requested: requests.filter((r) =>
      ["draft_po", "requested"].includes(
        r.status,
      ),
    ).length,
    approved: requests.filter((r) =>
      [
        "approved",
        "fbs_pickup_requested",
        "fbs_forwarded_to_fleet",
        "fbs_in_transit",
      ].includes(r.status),
    ).length,
    received: requests.filter(
      (r) => r.status === "received",
    ).length,
  };

  const filtered = requests.filter((r) => {
    const prod = Array.isArray(r.products)
      ? r.products[0]
      : r.products;
    const pName = prod?.name || "";
    const vendorMatch = r.supplier_name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const productMatch = pName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const itemsMatch =
      r.items?.list &&
      JSON.stringify(r.items.list)
        .toLowerCase()
        .includes(search.toLowerCase());
    return (
      vendorMatch || productMatch || itemsMatch
    );
  });

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
              Procurement Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Procurement Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            RFQ → Quotation Review → PO Generation
            → Stock Receipt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              (window.location.href =
                "/logistic/dept1/seller-verifications")
            }
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-lg h-10 px-6 bg-white hover:bg-slate-50 text-[10px] uppercase tracking-widest"
          >
            <Store className="h-4 w-4 mr-2 text-amber-500" />{" "}
            Verifications
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button className="px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 shadow-sm transition-all">
            Purchase Orders
          </button>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search orders or products..."
            className="pr-10 h-10 rounded-lg bg-white border-slate-200 font-bold text-slate-900 text-xs shadow-none"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Pending / RFQ Sent",
            val: statusCounts.requested,
            icon: ShoppingBag,
            color: "amber",
            sub: "Awaiting quotation",
          },
          {
            label: "Approved POs",
            val: statusCounts.approved,
            icon: FileText,
            color: "blue",
            sub: "Delivery scheduled",
          },
          {
            label: "Received",
            val: statusCounts.received,
            icon: CheckCircle2,
            color: "emerald",
            sub: "Stock confirmed",
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
                      "bg-amber-50 text-amber-600",
                    s.color === "blue" &&
                      "bg-blue-50 text-blue-600",
                    s.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600",
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
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                    {s.sub}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">
            All active Procurement & Stock
            Replenishment
          </CardTitle>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    PO ID
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Vendor / Supplier
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Product
                  </th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-slate-400 font-bold animate-pulse"
                    >
                      Loading requests...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-black text-xs text-slate-900 uppercase">
                          PO-
                          {request.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </div>
                        <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                          {request.status ===
                          "requested"
                            ? "RFQ Sent"
                            : request.status ===
                                  "approved" ||
                                request.status ===
                                  "fbs_pickup_requested"
                              ? "Awaiting Shipment"
                              : request.status ===
                                  "fbs_forwarded_to_fleet"
                                ? "Fleet Assigned"
                                : request.status ===
                                    "fbs_in_transit"
                                  ? "In Transit"
                                  : "Completed"}
                        </div>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-slate-700 uppercase">
                        {request.supplier_name}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            request.status ===
                              "received"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : [
                                    "approved",
                                    "fbs_pickup_requested",
                                    "fbs_forwarded_to_fleet",
                                    "fbs_in_transit",
                                  ].includes(
                                    request.status,
                                  )
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : request.status ===
                                    "rejected"
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100",
                          )}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {request.items?.list ? (
                          <div className="space-y-1">
                            {request.items.list
                              .slice(0, 2)
                              .map(
                                (
                                  item: any,
                                  idx: number,
                                ) => (
                                  <div
                                    key={idx}
                                    className="text-[10px] font-black text-slate-900 uppercase flex items-center justify-between gap-4"
                                  >
                                    <span>
                                      {item.name}
                                    </span>
                                    <span className="text-slate-400">
                                      {
                                        item.quantity
                                      }
                                      u
                                    </span>
                                  </div>
                                ),
                              )}
                            {request.items.list
                              .length > 2 && (
                              <div className="text-[8px] font-bold text-slate-400 uppercase">
                                +{" "}
                                {request.items
                                  .list.length -
                                  2}{" "}
                                more items
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="text-[10px] font-black text-slate-900 uppercase">
                              {
                                request.products
                                  ?.name
                              }
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                              {request.quantity}{" "}
                              Units
                            </div>
                          </>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {request.status ===
                        "draft_po" ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              const { error } =
                                await supabase
                                  .schema(
                                    "bpm-anec-global",
                                  )
                                  .from(
                                    "procurement",
                                  )
                                  .update({
                                    status:
                                      "requested",
                                  })
                                  .eq(
                                    "id",
                                    request.id,
                                  );
                              if (!error) {
                                toast.success(
                                  "PO Sent to Seller!",
                                );
                                fetchRequests();
                              }
                            }}
                            className="h-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest px-4"
                          >
                            Send to Seller
                          </Button>
                        ) : request.status ===
                          "fbs_pickup_requested" ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleForwardToLogistics2(
                                request,
                              )
                            }
                            className="h-8 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest px-4"
                          >
                            <Truck className="h-3 w-3 mr-2" />
                            Send to Logistics 2
                          </Button>
                        ) : request.status ===
                          "requested" ? (
                          <div className="flex items-center justify-end gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                            <Activity className="h-3 w-3 animate-pulse" />
                            Awaiting Response
                          </div>
                        ) : [
                            "fbs_pickup_requested",
                            "fbs_forwarded_to_fleet",
                            "fbs_in_transit",
                          ].includes(
                            request.status,
                          ) ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase">
                              <Activity className="h-3 w-3" />{" "}
                              Monitoring in PLT
                            </div>
                            <Link
                              href="/logistic/dept1/project-logistic-tracking"
                              className="text-[8px] font-bold text-slate-400 hover:text-slate-900 underline underline-offset-2"
                            >
                              View Tracker →
                            </Link>
                          </div>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest"
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
