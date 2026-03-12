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
  Truck,
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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  syncAllSellerStock,
  updateInventoryAndStock,
  receiveShipment,
} from "@/app/actions/warehouse";

interface SellerGroup {
  shopId: string;
  shopName: string;
  avatarUrl: string | null;
  fulfillmentType: string;
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

  const router = useRouter();

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
        products (id, name, slug, low_stock_threshold, stock_qty, barcode, price, categories(name), shop_id),
        shops:shop_id (id, name, avatar_url, fulfillment_type)
      `);

    if (!error && data) {
      setItems(data);

      // Group by shop
      const groups: Record<string, SellerGroup> =
        {};

      // 1. Process active inventory
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
        const fType =
          (item.shops as any)?.fulfillment_type ||
          "seller";

        if (!groups[shopId]) {
          groups[shopId] = {
            shopId,
            shopName,
            avatarUrl,
            fulfillmentType: fType,
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

  const handleToggleFulfillment = async (
    group: SellerGroup,
  ) => {
    const isNowWarehouse =
      group.fulfillmentType !== "warehouse";
    const toastId = toast.loading(
      `Updating ${group.shopName} fulfillment...`,
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shops")
      .update({
        fulfillment_type: isNowWarehouse
          ? "warehouse"
          : "seller",
      })
      .eq("id", group.shopId);

    if (error) {
      toast.error("Failed to update shop", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        `Shop now ${isNowWarehouse ? "Warehouse" : "Seller"} fulfilled!`,
        { id: toastId },
      );

      // Auto-sync stock if activating warehouse fulfillment
      if (isNowWarehouse) {
        handleSyncAllStock(group);
      } else {
        fetchInventory();
      }
    }
  };

  const handleSyncAllStock = async (
    group: SellerGroup,
  ) => {
    const toastId = toast.loading(
      `Syncing ${group.shopName} product stock...`,
    );

    try {
      console.log(
        `Starting sync for ${group.shopName}`,
        group.items,
      );

      // For each item in warehouse_inventory, update the corresponding product's stock_qty
      const result = await syncAllSellerStock(
        group.shopId,
        group.items,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Stock Synchronized!", {
        id: toastId,
        description: `All products for ${group.shopName} are now aligned with warehouse levels.`,
      });

      // Force refresh of everything
      await fetchInventory();
    } catch (err: any) {
      console.error("Sync process failed:", err);
      toast.error("Sync failed", {
        id: toastId,
        description: err.message,
      });
    }
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
      // Also update product stock_qty using server action to bypass RLS
      if (item.products?.id) {
        await updateInventoryAndStock(
          item.id,
          item.products.id,
          newQty,
        );
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
    // Find the current seller group from the latest state in case it updated
    const currentSeller =
      sellerGroups.find(
        (g) => g.shopId === selectedSeller.shopId,
      ) || selectedSeller;

    const filteredSellerItems =
      currentSeller.items.filter(
        (item) =>
          item.products?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          item.products?.barcode
            ?.toLowerCase()
            .includes(search.toLowerCase()),
      );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/logistic">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {selectedSeller.shopName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSeller(null);
              setSearch("");
            }}
            className="rounded-xl h-11 px-6 border-slate-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center overflow-hidden">
              {selectedSeller.avatarUrl ? (
                <img
                  src={selectedSeller.avatarUrl}
                  className="h-full w-full object-cover"
                  alt=""
                />
              ) : (
                <Store className="h-5 w-5 text-indigo-500" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                <PrivacyMask
                  value={selectedSeller.shopName}
                />
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {selectedSeller.totalSku} SKUs •{" "}
                  {selectedSeller.totalStock}{" "}
                  units
                </p>
                <div className="h-1 w-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  {selectedSeller.fulfillmentType ===
                  "warehouse"
                    ? "FBS Managed"
                    : "Seller Fulfilled"}
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() =>
              handleSyncAllStock(selectedSeller)
            }
            className="md:ml-auto rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black text-[10px] uppercase tracking-widest h-11 px-6"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-2" />
            Sync Product Stock
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative group w-full md:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search products or scan barcode..."
              className="pl-10 h-11 border-slate-200 rounded-xl bg-white shadow-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Filter:
            </span>
            <Button
              variant="outline"
              className="h-8 rounded-lg text-[10px] font-black uppercase"
            >
              Stock Low
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-lg text-[10px] font-black uppercase"
            >
              Out of Stock
            </Button>
          </div>
        </div>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
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
                        className={`p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 ${h === "Actions" ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSellerItems.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-10 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest"
                      >
                        No active inventory found.
                      </td>
                    </tr>
                  ) : (
                    filteredSellerItems.map(
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
                              <PrivacyMask
                                value={
                                  item.products
                                    ?.barcode ||
                                  "—"
                                }
                              />
                            </td>
                            <td className="p-5 text-xs font-bold text-slate-500 capitalize">
                              {item.products
                                ?.category || "—"}
                            </td>
                            <td className="p-5 font-black text-slate-900">
                              <td className="p-5 font-black text-slate-900">
                                ₱
                                <PrivacyMask
                                  value={Number(
                                    item.products
                                      ?.price ||
                                      0,
                                  ).toLocaleString()}
                                />
                              </td>
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
                    )
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>
              Warehouse Hub
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Cloud Warehouse
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            FBS Multi-Seller Integration •
            Inventory Control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(
                "/logistic/dept1/warehouse/receive",
              )
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-indigo-100"
          >
            <ScanLine className="h-4 w-4 mr-2" />{" "}
            Receive Inbound
          </Button>

          <Button
            onClick={fetchInventory}
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-4 bg-white"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "FBS Sellers",
            val: sellerGroups.length,
            icon: Store,
            color: "blue",
          },
          {
            label: "Unique SKUs",
            val: items.length,
            icon: Box,
            color: "indigo",
          },
          {
            label: "Total Units",
            val: totalStock,
            icon: PackageCheck,
            color: "emerald",
          },
          {
            label: "Stock Alerts",
            val: lowItems.length,
            icon: AlertTriangle,
            color: "rose",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-xl overflow-hidden bg-white relative group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-10 w-10 rounded-xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {loading ? "..." : s.val}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative group w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search seller shops..."
            className="pl-10 h-11 bg-transparent border-slate-200 shadow-none rounded-xl focus-visible:ring-indigo-500 font-medium text-sm"
          />
        </div>
      </div>

      <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">
            Managed Inventory Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Seller Account
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Range
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    On-Hand
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Health
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Details
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
                          className="h-8 px-3 rounded-lg font-black text-xs text-slate-400 hover:bg-slate-50"
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
    </div>
  );
}
