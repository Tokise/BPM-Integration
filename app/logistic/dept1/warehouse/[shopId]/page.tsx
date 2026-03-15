"use client";

import { useEffect, useState, use } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Search,
  PackageCheck,
  ArrowRight,
  RefreshCcw,
  Store,
  MapPin,
  ChevronRight,
  AlertCircle,
  Truck,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  syncAllSellerStock,
  updateInventoryAndStock,
  syncWarehouseFromProducts,
  receiveShipment,
} from "@/app/actions/warehouse";

interface SellerDetailProps {
  params: Promise<{ shopId: string }>;
}

export default function SellerDetailPage({
  params,
}: SellerDetailProps) {
  const { shopId } = use(params);
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sellerData, setSellerData] =
    useState<any>(null);
  const [inventory, setInventory] = useState<
    any[]
  >([]);

  useEffect(() => {
    fetchSellerInventory();
    fetchPendingInbound();
  }, [shopId]);

  const [activeTab, setActiveTab] = useState("inventory");
  const [pendingInbound, setPendingInbound] = useState<any[]>([]);
  const [receivingLocations, setReceivingLocations] = useState<Record<string, string>>({});

  const fetchPendingInbound = async () => {
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select("*, products(*)")
      .eq("status", "pending_inbound")
      .eq("shipment_type", "fbs_inbound")
      .order("created_at", { ascending: false });

    // Filter by products belonging to this shop manually if products join doesn't support shop filter directly
    if (data) {
      const filtered = data.filter((s: any) => s.products?.shop_id === shopId);
      setPendingInbound(filtered);
    }
  };

  const fetchSellerInventory = async () => {
    setLoading(true);

    // Fetch individual shop info
    const { data: shopRes } = await supabase
      .schema("bpm-anec-global")
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single();

    if (shopRes) {
      setSellerData(shopRes);
    }

    // Auto-sync warehouse quantities from product stock
    await syncWarehouseFromProducts(shopId);

    // Fetch inventory for this specific shop
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .select(
        `
        id,
        quantity,
        updated_at,
        shop_id,
        storage_location,
        warehouses (name, location),
        products (id, name, slug, low_stock_threshold, stock_qty, barcode, price, categories(name), shop_id)
      `,
      )
      .eq("shop_id", shopId);

    if (!error && data) {
      setInventory(data);
    }
    setLoading(false);
  };

  const handleSyncAllStock = async () => {
    const toastId = toast.loading(
      `Syncing product stock...`,
    );
    try {
      const result = await syncAllSellerStock(
        shopId,
        inventory,
      );
      if (!result.success)
        throw new Error(result.error);
      toast.success("Stock Synchronized!", {
        id: toastId,
      });
      fetchSellerInventory();
    } catch (err: any) {
      toast.error("Sync failed", {
        id: toastId,
        description: err.message,
      });
    }
  };

  const handlePickPack = async (item: any) => {
    if (item.quantity <= 0) {
      toast.error("No stock available to pick");
      return;
    }
    const toastId = toast.loading("Picking & packing...");
    const newQty = Math.max(0, item.quantity - 1);

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      toast.error("Pick failed", {
        id: toastId,
        description: error.message,
      });
    } else {
      if (item.products?.id) {
        await updateInventoryAndStock(item.id, item.products.id, newQty);
      }
      toast.success("Item Picked & Packed!", {
        id: toastId,
      });
      fetchSellerInventory();
    }
  };

  const handleReceivePending = async (item: any) => {
    const loc = receivingLocations[item.id] || "";
    if (!loc) {
      toast.error("Please assign a storage location (e.g., A-101)");
      return;
    }

    const toastId = toast.loading("Confirming receipt and updating inventory...");
    try {
      const result = await receiveShipment(item, loc);
      if (!result.success) throw new Error(result.error);
      
      toast.success(`Successfully received ${item.quantity} units!`, { id: toastId });
      fetchSellerInventory();
      fetchPendingInbound();
    } catch (err: any) {
      toast.error("Receipt failed", {
        id: toastId,
        description: err.message,
      });
    }
  };

  const filteredItems = inventory.filter(
    (item) =>
      item.products?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      item.products?.barcode
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const stats = {
    totalSku: inventory.length,
    totalStock: inventory.reduce(
      (a, b) => a + (b.quantity || 0),
      0,
    ),
    lowStock: inventory.filter(
      (i) =>
        i.quantity <=
        (i.products?.low_stock_threshold || 10),
    ).length,
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
            <BreadcrumbLink
              href="/logistic/dept1/warehouse"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Warehouse
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              {sellerData?.name || "Loading..."}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
            {sellerData?.avatar_url ? (
              <img
                src={sellerData.avatar_url}
                className="h-full w-full object-cover"
                alt=""
              />
            ) : (
              <Store className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1.5">
              <PrivacyMask
                value={sellerData?.name || "..."}
              />
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                {sellerData?.fulfillment_type ===
                "warehouse"
                  ? "FBS Managed"
                  : "Seller Fulfilled"}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {stats.totalSku} SKUs •{" "}
                {stats.totalStock} Units
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSyncAllStock}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg h-10 px-6 text-[10px] uppercase tracking-widest shadow-sm"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />{" "}
            Sync Product Stock
          </Button>
          <Button
            onClick={fetchSellerInventory}
            variant="outline"
            className="h-10 w-10 p-0 rounded-lg border-slate-200"
          >
            <RefreshCcw
              className={cn(
                "h-4 w-4",
                loading && "animate-spin",
              )}
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "inventory"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("inbound")}
            className={cn(
              "px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === "inbound"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Inbound
            {pendingInbound.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">
                {pendingInbound.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or scan barcode..."
              className="pl-10 h-10 border-slate-200 rounded-lg bg-white shadow-none font-bold text-xs"
            />
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-lg text-[10px] font-black uppercase px-4 border-slate-200 text-slate-500"
          >
            Filters
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "Product",
                    "Barcode",
                    "Location",
                    "Quantity",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "p-6 text-[10px] font-black uppercase tracking-widest text-slate-400",
                        h === "Actions" &&
                          "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-10 bg-slate-50/20" />
                    </tr>
                  ))
                ) : activeTab === "inventory" ? (
                  filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        No active inventory found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6">
                          <p className="font-black text-slate-900 text-sm uppercase">{item.products?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {item.products?.categories?.name || "General"}
                          </p>
                        </td>
                        <td className="p-6 font-mono text-xs text-slate-500">
                          <PrivacyMask value={item.products?.barcode || "—"} />
                        </td>
                        <td className="p-6 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                            <MapPin className="h-3.5 w-3.5 text-slate-300" />
                            {item.storage_location || "Not Assigned"}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-baseline gap-1">
                            <span className="font-black text-slate-900 text-sm">{item.quantity}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">/ {(item.products?.low_stock_threshold || 10)} min</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                              item.quantity <= 0
                                ? "bg-red-50 text-red-600 border-red-100"
                                : item.quantity <= (item.products?.low_stock_threshold || 10)
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100",
                            )}
                          >
                            {item.quantity <= 0 ? "Out of Stock" : item.quantity <= (item.products?.low_stock_threshold || 10) ? "Low Stock" : "Healthy"}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <Button
                            size="sm"
                            onClick={() => handlePickPack(item)}
                            variant="ghost"
                            className="h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black text-[9px] uppercase tracking-widest"
                          >
                            Pick & Pack
                          </Button>
                        </td>
                      </tr>
                    ))
                  )
                ) : pendingInbound.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <Truck className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        No pending inbound arrivals
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingInbound.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6">
                        <div className="space-y-1">
                          {s.items?.list ? (
                             s.items.list.map((it: any, idx: number) => (
                               <div key={idx} className="flex items-center justify-between gap-4">
                                 <span className="font-black text-xs text-slate-900 uppercase">{it.name}</span>
                                 <span className="text-[10px] text-slate-400 font-mono">x{it.quantity}</span>
                               </div>
                             ))
                          ) : (
                            <>
                              <p className="font-black text-slate-900 text-sm uppercase">{s.products?.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Single Item Shipment
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-6 font-mono text-xs text-slate-500">
                        #{s.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-6">
                        <Input
                          placeholder="ASSIGN LOCATION (E.G. A-101)"
                          className="h-8 text-[10px] font-black uppercase border-slate-200 focus:border-indigo-500 rounded-md w-48"
                          value={receivingLocations[s.id] || ""}
                          onChange={(e) => setReceivingLocations(prev => ({ ...prev, [s.id]: e.target.value.toUpperCase() }))}
                        />
                      </td>
                      <td className="p-6">
                        <span className="font-black text-slate-900 text-sm">
                          {s.items?.list ? s.items.list.reduce((acc: number, cur: any) => acc + cur.quantity, 0) : s.quantity} Units
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100">
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <Button
                          onClick={() => handleReceivePending(s)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg h-9 px-4 text-[9px] uppercase tracking-widest"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-2" />
                          Complete Receipt
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
