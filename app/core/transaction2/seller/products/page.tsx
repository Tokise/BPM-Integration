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
import {
  Package,
  Search,
  Plus,
  MoreHorizontal,
  Star,
  TrendingUp,
  Box,
  Loader2,
  Filter,
  Edit,
  Archive,
  Trash2,
  QrCode,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function ProductManagementPage() {
  const {
    user,
    shopId: contextShopId,
    shop: contextShop,
    sellerProducts,
    refreshSellerProducts,
  } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] =
    useState("");
  const [shop, setShop] = useState<any>(null);
  const [currentPage, setCurrentPage] =
    useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (sellerProducts) {
      setProducts(sellerProducts);
      setShop(contextShop);
      setLoading(false);
    } else if (contextShopId) {
      setShop(contextShop);
      fetchProductsOnly(contextShopId);
    } else if (user?.id) {
      fetchShopAndProducts();
    }
  }, [sellerProducts, contextShopId, user?.id]);

  async function fetchProductsOnly(sid: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `*, product_category_links(category:categories(name))`,
        )
        .eq("shop_id", sid)
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function fetchShopAndProducts() {
    setLoading(true);
    try {
      // 1. Get Shop
      console.log(
        "Fetching shop for user:",
        user?.id,
      );
      const { data: shopData, error: shopError } =
        await supabase
          .from("shops")
          .select("id, name")
          .eq("owner_id", user?.id)
          .single();

      if (shopError) {
        console.error(
          "Shop Fetch Error:",
          shopError,
        );
        throw shopError;
      }
      console.log("Shop found:", shopData);
      setShop(shopData);

      // 2. Get Products
      console.log(
        "Fetching products for shop:",
        shopData.id,
      );
      const {
        data: productsData,
        error: productsError,
      } = await supabase
        .from("products")
        .select(
          `
                    *,
                    product_category_links(category:categories(name))
                `,
        )
        .eq("shop_id", shopData.id)
        .order("created_at", {
          ascending: false,
        });

      if (productsError) {
        console.error(
          "Products Fetch Error:",
          productsError,
        );
        throw productsError;
      }
      console.log(
        "Products found:",
        productsData,
      );
      setProducts(productsData || []);
    } catch (error: any) {
      console.error(
        "Error in fetchShopAndProducts:",
        error,
      );
      toast.error(
        "Failed to load inventory: " +
          error.message,
      );
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (
    id: string,
    productName: string,
  ) => {
    toast(`Delete ${productName}?`, {
      description:
        "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const { error } = await supabase
              .from("products")
              .delete()
              .eq("id", id);

            if (error) throw error;
            setProducts((prev) =>
              prev.filter((p) => p.id !== id),
            );
            await refreshSellerProducts();
            toast.success(
              "Product deleted successfully",
            );
          } catch (error: any) {
            toast.error(
              "Failed to delete product",
            );
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleArchive = async (
    id: string,
    currentStatus: string,
    productName: string,
  ) => {
    const isArchived =
      currentStatus === "archived";
    const actionLabel = isArchived
      ? "Activate"
      : "Archive";

    toast(`${actionLabel} ${productName}?`, {
      description: `Product will be ${isArchived ? "visible" : "hidden"} from the shop.`,
      action: {
        label: actionLabel,
        onClick: async () => {
          try {
            const newStatus = isArchived
              ? "active"
              : "archived";
            const { error } = await supabase
              .from("products")
              .update({ status: newStatus })
              .eq("id", id);

            if (error) throw error;

            setProducts((prev) =>
              prev.map((p) =>
                p.id === id
                  ? { ...p, status: newStatus }
                  : p,
              ),
            );
            toast.success(
              `Product ${newStatus === "archived" ? "archived" : "activated"}`,
            );
            await refreshSellerProducts();
          } catch (error: any) {
            toast.error(
              "Failed to update product status",
            );
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.product_category_links?.some(
        (link: any) =>
          link.category?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
  );

  const totalPages = Math.ceil(
    filteredProducts.length / itemsPerPage,
  );
  const paginatedProducts =
    filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );

  // Stats Calculation
  const totalProducts = products.length;
  const inStock = products.filter(
    (p) => p.stock_qty > 0,
  ).length;
  // Mocking best seller and avg review for UI consistency with screenshot
  const bestSeller =
    products.length > 0
      ? products[0].name
      : "None";
  const avgReview = "4.6";
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/core/transaction2/seller">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Product Inventory
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Product Inventory
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
            Core 2: Catalog & Listing Management
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[280px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="pl-11 h-10 rounded-lg bg-white border border-slate-200 shadow-none font-medium focus-visible:ring-slate-900 text-xs"
              placeholder="Search products..."
            />
          </div>
          <Button
            onClick={() =>
              router.push(
                "/core/transaction2/seller/products/add",
              )
            }
            className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 flex items-center gap-2 shadow-none uppercase tracking-widest text-[10px]"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden group transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
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

        <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden group transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
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

        <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden group transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Best Seller
              </p>
              <p className="text-xl font-black text-slate-900 truncate max-w-[120px]">
                {bestSeller}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden group transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center shrink-0">
              <Star className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                Avg Review
              </p>
              <p className="text-3xl font-black text-slate-900">
                {avgReview}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="border border-slate-200 shadow-none rounded-lg p-10 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            All Listings
          </h2>
          <Button
            variant="outline"
            className="rounded-lg h-9 px-4 font-black text-[10px] uppercase tracking-widest text-slate-500 gap-2 border border-slate-200 shadow-none hover:bg-slate-50"
          >
            <Filter className="h-3.5 w-3.5" />{" "}
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent mt-10">
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
              {paginatedProducts.map((p) => {
                const isLowStock =
                  p.stock_qty > 0 &&
                  p.stock_qty < 5;
                const isOutOfStock =
                  p.stock_qty === 0;

                return (
                  <TableRow
                    key={p.id}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Box className="h-6 w-6 text-slate-200" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 leading-tight">
                            {p.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            ID: {p.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.barcode ? (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm inline-block group/qr relative cursor-zoom-in">
                          <QRCodeSVG
                            value={p.barcode}
                            size={48}
                            level="M"
                          />
                          <div className="absolute left-full top-0 ml-4 hidden group-hover/qr:block z-50 animate-in zoom-in-95 duration-200">
                            <div className="bg-white p-4 rounded-[20px] shadow-2xl border border-slate-100 ring-1 ring-slate-200/50">
                              <QRCodeSVG
                                value={p.barcode}
                                size={140}
                                level="M"
                              />
                              <p className="mt-3 font-mono text-[10px] text-slate-400 text-center font-bold tracking-widest">
                                {p.barcode}
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
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                        {p.product_category_links
                          ?.map(
                            (l: any) =>
                              l.category?.name,
                          )
                          .filter(Boolean)
                          .join(", ") ||
                          "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-slate-900 text-lg tracking-tighter">
                        ₱
                        {p.price.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-black text-lg tabular-nums",
                            isOutOfStock
                              ? "text-rose-500"
                              : isLowStock
                                ? "text-amber-500"
                                : "text-slate-900",
                          )}
                        >
                          {p.stock_qty}
                        </span>
                        {isLowStock &&
                          !isOutOfStock && (
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          p.status === "archived"
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : isOutOfStock
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100",
                        )}
                      >
                        {p.status === "archived"
                          ? "Archived"
                          : isOutOfStock
                            ? "Out of Stock"
                            : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                        >
                          <Button
                            variant="ghost"
                            className="h-12 w-12 rounded-2xl p-0 hover:bg-slate-100 transition-all active:scale-95"
                          >
                            <MoreHorizontal className="h-5 w-5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 p-2 rounded-[24px] border-slate-200 shadow-2xl ring-1 ring-black/5"
                        >
                          <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Product Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(
                                `/core/transaction2/seller/products/edit?id=${p.id}`,
                              )
                            }
                            className="h-12 px-4 rounded-xl font-bold text-slate-600 focus:text-slate-900 focus:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                              <Edit className="h-4 w-4" />
                            </div>
                            Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleArchive(
                                p.id,
                                p.status,
                                p.name,
                              )
                            }
                            className="h-12 px-4 rounded-xl font-bold text-slate-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                              <Archive className="h-4 w-4" />
                            </div>
                            {p.status ===
                            "archived"
                              ? "Reactivate"
                              : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2 bg-slate-100" />
                          <DropdownMenuItem
                            onSelect={() =>
                              handleDelete(
                                p.id,
                                p.name,
                              )
                            }
                            className="h-12 px-4 rounded-xl font-bold text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </div>
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Action Menu Implementation */}
          <div className="hidden">
            {/* This is a hack because the ShadCN DropdownMenu usage inside a map can be verbose. 
                 Instead, I'll inline the imports and use them directly in the map above.
             */}
          </div>

          {filteredProducts.length === 0 &&
            !loading && (
              <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
                No products found matching your
                search.
              </div>
            )}
        </div>

        <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-50">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Showing{" "}
            {filteredProducts.length > 0
              ? (currentPage - 1) * itemsPerPage +
                1
              : 0}{" "}
            to{" "}
            {Math.min(
              currentPage * itemsPerPage,
              filteredProducts.length,
            )}{" "}
            of {filteredProducts.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(1, prev - 1),
                )
              }
              className="h-10 px-4 rounded-lg font-bold border border-slate-200 shadow-none bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30"
            >
              Previous
            </Button>
            {Array.from(
              { length: totalPages },
              (_, i) => i + 1,
            ).map((i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "h-10 w-10 rounded-lg font-bold border-none shadow-none",
                  i === currentPage
                    ? "bg-slate-100 text-slate-900"
                    : "bg-transparent text-slate-400",
                )}
              >
                {i}
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1),
                )
              }
              className="h-10 px-4 rounded-lg font-bold border border-slate-200 shadow-none bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
