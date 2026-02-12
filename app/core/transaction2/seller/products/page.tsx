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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
        .select(`*, category:categories(name)`)
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
      const { data: shopData, error: shopError } =
        await supabase
          .from("shops")
          .select("id, name")
          .eq("owner_id", user?.id)
          .single();

      if (shopError) throw shopError;
      setShop(shopData);

      // 2. Get Products
      const {
        data: productsData,
        error: productsError,
      } = await supabase
        .from("products")
        .select(
          `
                    *,
                    category:categories(name)
                `,
        )
        .eq("shop_id", shopData.id)
        .order("created_at", {
          ascending: false,
        });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error: any) {
      console.error("Error:", error.message);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this product?",
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setProducts(
        products.filter((p) => p.id !== id),
      );
      await refreshSellerProducts();
      toast.success("Product deleted");
    } catch (error: any) {
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.category?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
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
    <div className="space-y-10 max-w-7xl mx-auto pb-20 px-4 md:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Product Inventory
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            Add, track, and manage your shop
            listings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="pl-12 h-12 rounded-2xl bg-white border-none shadow-sm font-medium focus-visible:ring-primary/20"
              placeholder="Search products..."
            />
          </div>
          <Button
            onClick={() =>
              router.push(
                "/core/transaction2/seller/products/add",
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
            <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
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
            <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
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

        <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
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
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[40px] p-10 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            All Listings
          </h2>
          <Button
            variant="ghost"
            className="rounded-xl h-10 px-4 font-bold text-slate-500 gap-2 border border-slate-50"
          >
            <Filter className="h-4 w-4" /> Filter
            by Status
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest h-12">
                  Product
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
              {filteredProducts.map((p) => {
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
                    <TableCell className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
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
                        <span className="font-bold text-slate-900">
                          {p.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-slate-500">
                        {p.category?.name ||
                          "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-slate-900">
                        ₱
                        {p.price.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-bold",
                          isOutOfStock
                            ? "text-red-500"
                            : isLowStock
                              ? "text-amber-500"
                              : "text-slate-900",
                        )}
                      >
                        {p.stock_qty}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                          isOutOfStock
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100",
                        )}
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        className="h-10 w-10 rounded-xl p-0 hover:bg-slate-100 transition-colors"
                      >
                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
            Showing 1 to {filteredProducts.length}{" "}
            of {products.length} entries
          </p>
          <div className="flex items-center gap-2">
            {[1, 2].map((i) => (
              <Button
                key={i}
                variant="outline"
                className={cn(
                  "h-10 w-10 rounded-xl font-bold border-none shadow-none",
                  i === 1
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
