"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Warehouse,
  Search,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  Box,
  RefreshCcw,
  Store,
  ScanLine,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Barcode,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface SellerGroup {
  shopId: string;
  shopName: string;
  avatarUrl: string | null;
  totalSku: number;
  totalStock: number;
  lowStockCount: number;
  items: any[];
}

export default function WarehousePage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Multi-seller view
  const [sellerGroups, setSellerGroups] =
    useState<SellerGroup[]>([]);
  const [selectedSeller, setSelectedSeller] =
    useState<SellerGroup | null>(null);

  // Inbound receiving dialog
  const [isReceiveOpen, setIsReceiveOpen] =
    useState(false);
  const [barcodeScan, setBarcodeScan] =
    useState("");
  const [receiveQty, setReceiveQty] =
    useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);

    // Fetch inventory with shop and product details
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory").select(`
        id,
        quantity,
        updated_at,
        shop_id,
        warehouses (name, location),
        products (id, name, slug, low_stock_threshold, stock_qty, barcode, price, category, shop_id),
        shops:shop_id (id, name, avatar_url)
      `);

    if (!error && data) {
      setItems(data);

      // Group by shop
      const groups: Record<string, SellerGroup> =
        {};
      data.forEach((item: any) => {
        const shopId =
          item.shop_id ||
          item.products?.shop_id ||
          "internal";
        const shopName =
          (item.shops as any)?.name ||
          "Internal Inventory";
        const avatarUrl =
          (item.shops as any)?.avatar_url || null;

        if (!groups[shopId]) {
          groups[shopId] = {
            shopId,
            shopName,
            avatarUrl,
            totalSku: 0,
            totalStock: 0,
            lowStockCount: 0,
            items: [],
          };
        }
        groups[shopId].totalSku++;
        groups[shopId].totalStock +=
          item.quantity || 0;
        if (
          item.quantity <=
          (item.products?.low_stock_threshold ||
            10)
        ) {
          groups[shopId].lowStockCount++;
        }
        groups[shopId].items.push(item);
      });

      setSellerGroups(Object.values(groups));
    }
    setLoading(false);
  };

  const handleAutoRestock = async (item: any) => {
    const productName =
      item.products?.name || "Unknown Product";
    const shopName =
      selectedSeller?.shopName || "Unknown";
    const toastId = toast.loading(
      `Creating PO for ${productName}...`,
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("procurement")
      .insert({
        product_id: item.products?.id,
        supplier_name: shopName,
        quantity:
          (item.products?.low_stock_threshold ||
            10) * 2,
        status: "requested",
      });

    if (error) {
      toast.error("Failed to create PO", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success("PO Sent to Seller!", {
        id: toastId,
        description: `${shopName} will receive a replenishment request for ${productName}.`,
      });
    }
  };

  const handlePickPack = async (item: any) => {
    if (item.quantity <= 0) {
      toast.error("No stock available to pick");
      return;
    }
    const toastId = toast.loading(
      "Picking & packing...",
    );
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
      // Also update product stock_qty
      if (item.products?.id) {
        await supabase
          .schema("bpm-anec-global")
          .from("products")
          .update({ stock_qty: newQty })
          .eq("id", item.products.id);
      }

      toast.success("Item Picked & Packed!", {
        id: toastId,
        description: `Stock: ${newQty} remaining.`,
      });

      const threshold =
        item.products?.low_stock_threshold || 10;
      if (newQty <= threshold) {
        toast.info(
          "⚠️ Low stock — auto-PO sent to seller",
        );
        await handleAutoRestock(item);
      }
      fetchInventory();
    }
  };

  const handleReceiveInbound = async () => {
    if (!barcodeScan) {
      toast.error("Scan or enter a barcode/name");
      return;
    }

    const toastId = toast.loading(
      "Processing inbound scan...",
    );
    const qty = parseInt(receiveQty || "1");

    // Find product by barcode or name
    const { data: product } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .select("id, name, shop_id, stock_qty")
      .or(
        `barcode.eq.${barcodeScan},name.ilike.%${barcodeScan}%`,
      )
      .limit(1)
      .single();

    if (!product) {
      toast.error("Product not found", {
        id: toastId,
        description: `No product matches "${barcodeScan}"`,
      });
      return;
    }

    // Check if warehouse_inventory entry exists
    const { data: existing } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .select("id, quantity")
      .eq("product_id", product.id)
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const newQty =
        (existing.quantity || 0) + qty;
      await supabase
        .schema("bpm-anec-global")
        .from("warehouse_inventory")
        .update({
          quantity: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      // Update product stock
      await supabase
        .schema("bpm-anec-global")
        .from("products")
        .update({
          stock_qty:
            (product.stock_qty || 0) + qty,
        })
        .eq("id", product.id);

      toast.success("Inbound Received!", {
        id: toastId,
        description: `${product.name}: +${qty} units. Now ${newQty} in warehouse.`,
      });
    } else {
      // Create new entry
      const { data: warehouses } = await supabase
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

      // Update product stock
      await supabase
        .schema("bpm-anec-global")
        .from("products")
        .update({
          stock_qty:
            (product.stock_qty || 0) + qty,
        })
        .eq("id", product.id);

      toast.success("New Item Received!", {
        id: toastId,
        description: `${product.name}: ${qty} units stored. Product is now live!`,
      });
    }

    setBarcodeScan("");
    setReceiveQty("");
    setIsReceiveOpen(false);
    fetchInventory();
  };

  const totalStock = items.reduce(
    (a, i) => a + (i.quantity || 0),
    0,
  );
  const lowItems = items.filter(
    (i) =>
      i.quantity <=
      (i.products?.low_stock_threshold || 10),
  );

  // Seller detail view
  if (selectedSeller) {
    const sellerItems = selectedSeller.items;
    const filteredSellerItems =
      sellerItems.filter(
        (item) =>
          item.products?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          item.products?.barcode
            ?.toLowerCase()
            .includes(search.toLowerCase()),
      );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedSeller(null);
              setSearch("");
            }}
            className="rounded-xl h-11 px-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
              {selectedSeller.avatarUrl ? (
                <img
                  src={selectedSeller.avatarUrl}
                  className="h-full w-full object-cover"
                  alt=""
                />
              ) : (
                <Store className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                {selectedSeller.shopName}
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {selectedSeller.totalSku} SKUs •{" "}
                {selectedSeller.totalStock} total
                units
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by product name or barcode..."
              className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-medium"
            />
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    {[
                      "Product",
                      "Barcode",
                      "Category",
                      "Price",
                      "Location",
                      "Stock",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 ${h === "Actions" ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSellerItems.map(
                    (item) => {
                      const threshold =
                        item.products
                          ?.low_stock_threshold ||
                        10;
                      const isLow =
                        item.quantity <=
                        threshold;
                      const isOut =
                        item.quantity <= 0;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-5">
                            <p className="font-bold text-slate-900">
                              {
                                item.products
                                  ?.name
                              }
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {
                                item.products
                                  ?.slug
                              }
                            </p>
                          </td>
                          <td className="p-5 font-mono text-xs text-slate-500">
                            {item.products
                              ?.barcode || "—"}
                          </td>
                          <td className="p-5 text-xs font-bold text-slate-500 capitalize">
                            {item.products
                              ?.category || "—"}
                          </td>
                          <td className="p-5 font-black text-slate-900">
                            ₱
                            {Number(
                              item.products
                                ?.price || 0,
                            ).toLocaleString()}
                          </td>
                          <td className="p-5 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-300" />
                              {item.warehouses
                                ?.name ||
                                "Main"}{" "}
                              —{" "}
                              {item.warehouses
                                ?.location ||
                                "A1"}
                            </div>
                          </td>
                          <td className="p-5 font-black text-slate-900">
                            {item.quantity}
                            <span className="text-[10px] text-slate-400 ml-1">
                              / min {threshold}
                            </span>
                          </td>
                          <td className="p-5">
                            <span
                              className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${
                                isOut
                                  ? "bg-red-50 text-red-600"
                                  : isLow
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-green-50 text-green-600"
                              }`}
                            >
                              {isOut
                                ? "Out"
                                : isLow
                                  ? "Low"
                                  : "OK"}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isOut}
                                onClick={() =>
                                  handlePickPack(
                                    item,
                                  )
                                }
                                className="h-8 rounded-lg font-black text-[10px] uppercase text-emerald-600 hover:bg-emerald-50"
                              >
                                <PackageCheck className="h-3 w-3 mr-1" />
                                Pick
                              </Button>
                              {isLow && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleAutoRestock(
                                      item,
                                    )
                                  }
                                  className="h-8 rounded-lg font-black text-[10px] uppercase text-amber-600 hover:bg-amber-50"
                                >
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  PO
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view — grouped by seller (like finance collection)
  const filteredGroups = sellerGroups.filter(
    (g) =>
      g.shopName
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Smart Warehousing
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Multi-seller inventory • Pick/Pack •
            Inbound Receiving
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsReceiveOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-blue-200"
          >
            <ScanLine className="h-4 w-4 mr-2" />{" "}
            Receive Inbound
          </Button>
          <Button
            onClick={fetchInventory}
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-4"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Sellers in FBS",
            val: sellerGroups.length,
            icon: Store,
            color: "blue",
          },
          {
            label: "Total SKUs",
            val: items.length,
            icon: Warehouse,
            color: "purple",
          },
          {
            label: "Total Stock",
            val: totalStock,
            icon: PackageCheck,
            color: "emerald",
          },
          {
            label: "Low Stock Alerts",
            val: lowItems.length,
            icon: AlertTriangle,
            color: "amber",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white relative group"
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
              <p className="text-4xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search seller shops..."
            className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-medium"
          />
        </div>
      </div>

      {/* Seller cards — like finance collection */}
      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black tracking-tight">
            Seller Inventory
          </CardTitle>
          <Store className="h-5 w-5 text-slate-300" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Seller
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    SKUs
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Total Stock
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Alerts
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse"
                    >
                      <td
                        colSpan={5}
                        className="p-10 bg-slate-50/20"
                      />
                    </tr>
                  ))
                ) : filteredGroups.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-20 text-center"
                    >
                      <Warehouse className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold italic">
                        No FBS sellers yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr
                      key={g.shopId}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() =>
                        setSelectedSeller(g)
                      }
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
                            {g.avatarUrl ? (
                              <img
                                src={g.avatarUrl}
                                className="h-full w-full object-cover"
                                alt=""
                              />
                            ) : (
                              <Store className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <span className="font-black text-slate-900 text-sm">
                            {g.shopName}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                          {g.totalSku} items
                        </span>
                      </td>
                      <td className="p-5 font-black text-slate-900 text-lg">
                        {g.totalStock}
                      </td>
                      <td className="p-5">
                        {g.lowStockCount > 0 ? (
                          <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {g.lowStockCount} low
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                            All OK
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeller(g);
                          }}
                          variant="ghost"
                          className="h-8 px-3 rounded-lg font-black text-xs text-blue-500 hover:bg-blue-50"
                        >
                          View{" "}
                          <ChevronRight className="h-3 w-3 ml-1" />
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

      {/* Receive Inbound Dialog */}
      <Dialog
        open={isReceiveOpen}
        onOpenChange={setIsReceiveOpen}
      >
        <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <ScanLine className="h-6 w-6 text-blue-500" />
              Receive Inbound
            </DialogTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Scan barcode or enter product name
            </p>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                Barcode / Product Name
              </label>
              <Input
                value={barcodeScan}
                onChange={(e) =>
                  setBarcodeScan(e.target.value)
                }
                placeholder="Scan or type here..."
                className="h-14 bg-slate-50 border-none rounded-xl font-bold mt-1 text-lg"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                Quantity
              </label>
              <Input
                type="number"
                value={receiveQty}
                onChange={(e) =>
                  setReceiveQty(e.target.value)
                }
                placeholder="1"
                className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-1"
              />
            </div>
            <Button
              onClick={handleReceiveInbound}
              className="w-full h-12 rounded-xl font-black bg-blue-500 text-white hover:bg-blue-600 mt-2"
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Receive & Store
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
