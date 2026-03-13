"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ChevronRight,
  ArrowUpRight,
  Loader2,
  Package2,
  QrCode,
  CheckCircle2,
  Info,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const itemsPerPage = 6;

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

    if (!prodErr && prodData) {
      setProducts(prodData);

      const pMap: Record<string, number> = {};
      if (inboundData) {
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

  const handleDelete = async (
    id: string,
    name: string,
  ) => {
    toast(`Delete ${name}?`, {
      description:
        "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          const { error } = await supabase
            .schema("bpm-anec-global")
            .from("products")
            .delete()
            .eq("id", id);
          if (error)
            toast.error(
              "Failed to delete product",
            );
          else {
            toast.success("Product deleted");
            fetchProducts();
          }
        },
      },
    });
  };

  const handleArchive = async (
    id: string,
    currentStatus: string,
    name: string,
  ) => {
    const isArchived =
      currentStatus === "archived";
    const newStatus = isArchived
      ? "active"
      : "archived";

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .update({ status: newStatus })
      .eq("id", id);

    if (error)
      toast.error("Failed to update status");
    else {
      toast.success(`Product ${newStatus}`);
      fetchProducts();
    }
  };

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
        quantity: Math.max(
          product.low_stock_threshold * 2,
          20,
        ),
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
            "Stock will update once received at the warehouse.",
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
        label: `PENDING (+${pendingQty})`,
        color:
          "text-blue-600 bg-blue-50 border-blue-100",
      };
    if (qty === 0)
      return {
        label: "OUT OF STOCK",
        color:
          "text-red-600 bg-red-50 border-red-100",
      };
    if (qty <= threshold)
      return {
        label: "LOW STOCK",
        color:
          "text-amber-600 bg-amber-50 border-amber-100",
      };
    return {
      label: "IN STOCK",
      color:
        "text-emerald-600 bg-emerald-50 border-emerald-100",
    };
  };

  const totals = {
    products: products.length,
    active: products.filter(
      (p) => p.status === "active",
    ).length,
    low: products.filter(
      (p) =>
        (p.stock_qty || 0) <=
          (p.low_stock_threshold || 10) &&
        (p.stock_qty || 0) > 0,
    ).length,
    pending: Object.values(pendingMap).reduce(
      (a, b) => a + b,
      0,
    ),
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        <Link
          href="/core/transaction2/fbs"
          className="hover:text-primary transition-colors"
        >
          DASHBOARD
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          PRODUCT INVENTORY
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
            Product Inventory
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            FULFILLED BY STORE — WAREHOUSE CATALOG
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-11 rounded-lg bg-white border border-slate-200 shadow-none font-medium focus-visible:ring-primary focus-visible:border-primary transition-all"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
          <Button
            onClick={() =>
              router.push(
                "/core/transaction2/fbs/products/add",
              )
            }
            className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black rounded-lg h-11 px-8 flex items-center gap-2 transition-all border-none text-[10px] uppercase tracking-widest shadow-none"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Products",
            value: totals.products,
            icon: Package2,
            color: "text-slate-900",
            bg: "bg-slate-50",
          },
          {
            label: "Active Listings",
            value: totals.active,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            label: "Low Stock Alert",
            value: totals.low,
            icon: TrendingUp,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            label: "Inbound Transit",
            value: totals.pending,
            icon: Truck,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border border-slate-200 shadow-none rounded-lg p-5 bg-white overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                  stat.bg,
                  stat.color,
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Section */}
      <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            Product Catalog
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-none flex items-center gap-1"
            >
              <Warehouse className="h-3 w-3" />
              Warehouse Managed
            </Badge>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-0">
                  Product Details
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Barcode
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Category
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Price
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Stock
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-0">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-20 pl-0 pr-0"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
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
                        <TableCell className="py-5 pl-0">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
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
                                <Package2 className="h-6 w-6 text-slate-200" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block line-clamp-1">
                                {product.name}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">
                                ID:{" "}
                                {product.id
                                  .slice(0, 8)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.barcode ? (
                            <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm inline-block group/qr relative cursor-zoom-in">
                              <QRCodeSVG
                                value={
                                  product.barcode
                                }
                                size={48}
                                level="M"
                              />
                              <div className="absolute left-full top-0 ml-4 hidden group-hover/qr:block z-50 animate-in zoom-in-95 duration-200">
                                <div className="bg-white p-4 rounded-[20px] shadow-2xl border border-slate-100 ring-1 ring-slate-200/50">
                                  <QRCodeSVG
                                    value={
                                      product.barcode
                                    }
                                    size={140}
                                    level="M"
                                  />
                                  <p className="mt-3 font-mono text-[10px] text-slate-400 text-center font-bold tracking-widest">
                                    {
                                      product.barcode
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                            {product.categories
                              ?.name ||
                              "Uncategorized"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-black text-slate-900 text-base">
                            ₱
                            {product.price.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-black text-sm",
                                isOutOfStock
                                  ? "text-red-500"
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
                              <Badge
                                variant="outline"
                                className="text-[8px] font-black px-1.5 h-4 bg-blue-50 text-blue-600 border-blue-100"
                              >
                                +
                                {
                                  pendingMap[
                                    product.id
                                  ]
                                }
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border",
                              status.color,
                            )}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-0">
                          <div className="flex items-center justify-end gap-2">
                            {isOutOfStock &&
                            !pendingMap[
                              product.id
                            ] ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendToWarehouse(
                                    product,
                                  )
                                }
                                className="h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-4 border-none shadow-none transition-all"
                              >
                                <Truck className="h-3.5 w-3.5 mr-2" />
                                Restock
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-lg group-hover:bg-slate-100 transition-all"
                                asChild
                              >
                                <Link
                                  href={`/core/transaction2/fbs/products/edit?id=${product.id}`}
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                              >
                                <Button
                                  variant="ghost"
                                  className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-56 p-2 rounded-[20px] border-slate-200 shadow-2xl"
                              >
                                <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Inventory
                                  Actions
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    router.push(
                                      `/core/transaction2/fbs/products/edit?id=${product.id}`,
                                    )
                                  }
                                  className="h-11 px-4 rounded-xl font-bold text-slate-600 focus:text-slate-900 focus:bg-slate-50 cursor-pointer flex items-center gap-3"
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />{" "}
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleArchive(
                                      product.id,
                                      product.status,
                                      product.name,
                                    )
                                  }
                                  className="h-11 px-4 rounded-xl font-bold text-slate-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer flex items-center gap-3"
                                >
                                  <Archive className="h-4 w-4 text-amber-500" />{" "}
                                  {product.status ===
                                  "archived"
                                    ? "Reactivate"
                                    : "Archive"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleDelete(
                                      product.id,
                                      product.name,
                                    )
                                  }
                                  className="h-11 px-4 rounded-xl font-bold text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer flex items-center gap-3"
                                >
                                  <Trash2 className="h-4 w-4 text-rose-500" />{" "}
                                  Delete
                                  Permanently
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  },
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-20 pl-0 pr-0"
                  >
                    <Package className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                      Your FBS catalog is empty
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filtered.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Showing{" "}
              {(currentPage - 1) * itemsPerPage +
                1}{" "}
              to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filtered.length,
              )}{" "}
              of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((i) => (
                <Button
                  key={i}
                  variant="outline"
                  onClick={() =>
                    setCurrentPage(i)
                  }
                  className={cn(
                    "h-9 w-9 rounded-lg font-black text-xs border border-slate-200 shadow-none transition-all",
                    i === currentPage
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-transparent text-slate-400 hover:text-slate-900 hover:border-slate-300",
                  )}
                >
                  {i}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
