"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  Truck,
  Warehouse,
  Box,
  TrendingUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function FBSProductsPage() {
  const { shop } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>(
    [],
  );
  const [pendingMap, setPendingMap] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] =
    useState(1);
  const itemsPerPage = 8;

  const fetchProducts = useCallback(async () => {
    if (!shop?.id) return;
    setLoading(true);
    const { data: prodData, error: prodErr } =
      await supabase
        .schema("bpm-anec-global")
        .from("products")
        .select("*, categories(name)")
        .eq("shop_id", shop.id)
        .order("created_at", {
          ascending: false,
        });

    // Fetch pending inbound stock from shipments
    const { data: inboundData } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select("product_id, quantity, status")
      .eq("shipment_type", "fbs_inbound")
      .in("status", [
        "requested",
        "pending_inbound",
        "fbs_in_transit",
        "fbs_dispatched",
        "fbs_forwarded_to_fleet",
      ]);
    // Using a rough mapping via product_id since shipment doesn't have supplier_name directly in the same way procurement did initially
    // For a seller, we can just aggregate by products they own later in the loop

    if (!prodErr && prodData) {
      console.log(
        "FBS fetchProducts succeeded:",
        prodData,
      );
      setProducts(prodData);

      const pMap: Record<string, number> = {};
      if (inboundData) {
        // Only count for products owned by this shop
        const shopProductIds = prodData.map(
          (p) => p.id,
        );
        inboundData.forEach((p) => {
          if (
            p.product_id &&
            shopProductIds.includes(p.product_id)
          ) {
            pMap[p.product_id] =
              (pMap[p.product_id] || 0) +
              (p.quantity || 0);
          }
        });
      }
      setPendingMap(pMap);
    }
    setLoading(false);
  }, [shop]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSendToWarehouse = async (
    product: any,
  ) => {
    const toastId = toast.loading(
      "Creating outbound shipment request...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .insert({
        product_id: product.id,
        quantity:
          product.low_stock_threshold * 2 || 20,
        shipment_type: "fbs_inbound",
        status: "requested",
      });

    if (error) {
      toast.error("Failed to create request", {
        id: toastId,
        description: error.message,
      });
    } else {
      toast.success(
        "Outbound Shipment Requested!",
        {
          id: toastId,
          description:
            "Ship your products to the warehouse. Stock will update once received.",
        },
      );
      fetchProducts();
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.barcode
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.categories?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(
    filtered.length / itemsPerPage,
  );
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStockStatus = (product: any) => {
    const qty = product.stock_qty || 0;
    const threshold =
      product.low_stock_threshold || 10;
    const pendingQty =
      pendingMap[product.id] || 0;

    if (qty === 0 && pendingQty > 0)
      return {
        label: `Pending (+${pendingQty})`,
        cls: "bg-blue-50 text-blue-600 border-blue-100",
      };
    if (qty === 0)
      return {
        label: "Out of Stock",
        cls: "bg-slate-100 text-slate-600 border-slate-200",
      };
    if (qty <= threshold)
      return {
        label: "Low Stock",
        cls: "bg-amber-50 text-amber-600 border-amber-100",
      };
    return {
      label: "In Stock",
      cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };
  };

  const totalProducts = products.length;
  const inStock = products.filter(
    (p) => (p.stock_qty || 0) > 0,
  ).length;
  const pendingInbound =
    Object.keys(pendingMap).length;
  const lowStock = products.filter((p) => {
    const qty = p.stock_qty || 0;
    return (
      qty > 0 &&
      qty <= (p.low_stock_threshold || 10)
    );
  }).length;

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Product Inventory
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            Warehouse-fulfilled product catalog —
            FBS
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-12 h-12 rounded-2xl bg-white border-none shadow-sm font-medium focus-visible:ring-primary/20"
              placeholder="Search products..."
            />
          </div>
          <Button
            onClick={() =>
              router.push(
                "/core/transaction2/fbs/products/add",
              )
            }
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl h-12 px-8 flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
              <Box className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Total Products
              </p>
              <p className="text-3xl font-black text-slate-900">
                {totalProducts}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                In Stock
              </p>
              <p className="text-3xl font-black text-slate-900">
                {inStock}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
              <Warehouse className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Pending Inbound
              </p>
              <p className="text-3xl font-black text-slate-900">
                {pendingInbound}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Low Stock
              </p>
              <p className="text-3xl font-black text-slate-900">
                {lowStock}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] p-10 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            All Listings
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <Warehouse className="h-3 w-3" />
            Warehouse Fulfilled
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Product
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Barcode
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Category
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Price
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Stock
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-20 text-slate-400 font-bold animate-pulse"
                  >
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map(
                  (product) => {
                    const status =
                      getStockStatus(product);
                    const isOutOfStock =
                      (product.stock_qty || 0) ===
                      0;
                    const isLowStock =
                      (product.stock_qty || 0) >
                        0 &&
                      (product.stock_qty || 0) <=
                        (product.low_stock_threshold ||
                          10);

                    return (
                      <TableRow
                        key={product.id}
                        className="border-slate-50 hover:bg-slate-50/50 transition-colors group"
                      >
                        <TableCell className="py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                              {product
                                .images?.[0] ? (
                                <img
                                  src={
                                    product
                                      .images[0]
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Box className="h-6 w-6 text-slate-200" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900">
                                {product.name}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.barcode ? (
                            <div className="group/qr relative">
                              <span className="font-mono text-xs text-slate-500 cursor-pointer hover:text-slate-900 transition-colors">
                                {product.barcode}
                              </span>
                              <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover/qr:opacity-100 pointer-events-none transition-opacity bg-white p-3 rounded-2xl shadow-xl border border-slate-100 z-10 w-max">
                                <QRCodeSVG
                                  value={
                                    product.barcode
                                  }
                                  size={100}
                                  level="M"
                                  includeMargin={
                                    false
                                  }
                                />
                                <p className="text-[9px] font-bold text-slate-400 text-center mt-2 uppercase tracking-widest">
                                  Scan to Verify
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-slate-500 capitalize">
                            {product.categories
                              ?.name || "General"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-black text-slate-900">
                            ₱
                            {Number(
                              product.price,
                            ).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                "font-bold",
                                isOutOfStock
                                  ? "text-slate-400"
                                  : isLowStock
                                    ? "text-amber-500"
                                    : "text-slate-900",
                              )}
                            >
                              {product.stock_qty ||
                                0}
                            </span>
                            {pendingMap[
                              product.id
                            ] > 0 && (
                              <span className="text-[9px] font-bold text-blue-500">
                                +
                                {
                                  pendingMap[
                                    product.id
                                  ]
                                }{" "}
                                arriving
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                              status.cls,
                            )}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(product.stock_qty ||
                            0) === 0 &&
                            !pendingMap[
                              product.id
                            ] && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendToWarehouse(
                                    product,
                                  )
                                }
                                className="h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4"
                              >
                                <Truck className="h-3 w-3 mr-1.5" />
                                Send to Warehouse
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-20"
                  >
                    <Package className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                      No products found — add your
                      first FBS product
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-50">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Showing{" "}
            {filtered.length > 0
              ? (currentPage - 1) * itemsPerPage +
                1
              : 0}{" "}
            to{" "}
            {Math.min(
              currentPage * itemsPerPage,
              filtered.length,
            )}{" "}
            of {filtered.length} entries
          </p>
          <div className="flex items-center gap-2">
            {Array.from(
              { length: totalPages },
              (_, i) => i + 1,
            ).map((i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "h-10 w-10 rounded-xl font-bold border-none shadow-none",
                  i === currentPage
                    ? "bg-slate-100 text-slate-900"
                    : "bg-transparent text-slate-400",
                )}
              >
                {i}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
