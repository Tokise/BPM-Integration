"use client";

import {
  useState,
  useEffect,
  Suspense,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Upload,
  X,
  Package,
  Store,
  QrCode,
  Check,
  Info,
  ChevronRight,
  Package2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const supabase = createClient();

function EditProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { user, refreshSellerProducts } =
    useUser();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] =
    useState(true);
  const [categories, setCategories] = useState<
    any[]
  >([]);
  const [shop, setShop] = useState<any>(null);
  const [uploading, setUploading] =
    useState(false);
  const [categorySearch, setCategorySearch] =
    useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_qty: "",
    category_ids: [] as string[],
    images: [] as string[],
    low_stock_threshold: "10",
    barcode: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !productId) return;

      setInitialLoading(true);
      try {
        const { data: shopData } = await supabase
          .schema("bpm-anec-global")
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .single();
        setShop(shopData);

        const { data: catData } = await supabase
          .schema("bpm-anec-global")
          .from("categories")
          .select("*")
          .order("name");
        setCategories(catData || []);

        const { data: product, error } =
          await supabase
            .schema("bpm-anec-global")
            .from("products")
            .select(
              "*, product_category_links(category_id)",
            )
            .eq("id", productId)
            .single();

        if (error) throw error;

        setFormData({
          name: product.name,
          description: product.description || "",
          price: product.price.toString(),
          stock_qty: product.stock_qty.toString(),
          category_ids:
            product.product_category_links.map(
              (l: any) => l.category_id,
            ),
          images: product.images || [],
          low_stock_threshold: (
            product.low_stock_threshold || 10
          ).toString(),
          barcode: product.barcode,
        });
      } catch (err) {
        toast.error(
          "Failed to load product details",
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [user?.id, productId]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (
      !files ||
      files.length === 0 ||
      !user ||
      !shop
    )
      return;

    setUploading(true);
    try {
      const newImages = [...formData.images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name
          .split(".")
          .pop();
        const fileName = `${user.id}/${shop.id}/${Date.now()}-${i}.${fileExt}`;
        const { error: uploadError } =
          await supabase.storage
            .from("shop-profiles")
            .upload(fileName, file);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("shop-profiles")
          .getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
      setFormData({
        ...formData,
        images: newImages,
      });
      toast.success("Images uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const toggleCategory = (catId: string) => {
    const isSelected =
      formData.category_ids.includes(catId);
    setFormData({
      ...formData,
      category_ids: isSelected
        ? formData.category_ids.filter(
            (id) => id !== catId,
          )
        : [...formData.category_ids, catId],
    });
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!shop || !user || !productId) return;

    if (
      !formData.name ||
      !formData.price ||
      !formData.stock_qty ||
      formData.category_ids.length === 0
    ) {
      toast.error(
        "Please fill in required fields",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock_qty: parseInt(formData.stock_qty),
          images: formData.images,
          low_stock_threshold: parseInt(
            formData.low_stock_threshold,
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;

      await supabase
        .schema("bpm-anec-global")
        .from("product_category_links")
        .delete()
        .eq("product_id", productId);

      if (formData.category_ids.length > 0) {
        await supabase
          .schema("bpm-anec-global")
          .from("product_category_links")
          .insert(
            formData.category_ids.map(
              (catId) => ({
                product_id: productId,
                category_id: catId,
              }),
            ),
          );
      }

      await refreshSellerProducts();
      toast.success("Product updated!");
      router.push(
        "/core/transaction2/seller/products",
      );
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) => {
      const matchesSearch = cat.name
        .toLowerCase()
        .includes(categorySearch.toLowerCase());
      const isSelected =
        formData.category_ids.includes(cat.id);
      const matchesFilter =
        categoryFilter === "all" ||
        (categoryFilter === "selected" &&
          isSelected);
      return matchesSearch && matchesFilter;
    },
  );

  if (initialLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Waking up the editor...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        <Link
          href="/core/transaction2/seller"
          className="hover:text-primary transition-colors"
        >
          DASHBOARD
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <Link
          href="/core/transaction2/seller/products"
          className="hover:text-primary transition-colors"
        >
          PRODUCT MANAGEMENT
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          EDIT LISTING
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
            Modify Listing
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            MARKETPLACE CATALOG & INVENTORY SETUP
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <Package2 className="h-5 w-5 text-blue-500" />
              Product Information
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Product Display Name
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-slate-900 px-4 focus-visible:ring-primary"
                  placeholder="Enter product name..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Marketplace Description
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="min-h-[160px] rounded-lg bg-slate-50/50 border-slate-200 font-medium text-slate-600 resize-none p-4 focus-visible:ring-primary"
                  placeholder="Describe your product..."
                />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <Store className="h-5 w-5 text-indigo-500" />
              Pricing & Inventory
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Market Price (PHP)
                </Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value,
                    })
                  }
                  className="h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-slate-900 px-4 focus-visible:ring-primary"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Units In Stock
                </Label>
                <Input
                  type="number"
                  value={formData.stock_qty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_qty: e.target.value,
                    })
                  }
                  className="h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-slate-900 px-4 focus-visible:ring-primary"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <QrCode className="h-5 w-5 text-emerald-500" />
              Category Assignment
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative group w-full sm:w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) =>
                      setCategorySearch(
                        e.target.value,
                      )
                    }
                    className="h-9 pl-9 pr-4 rounded-lg bg-slate-50 border-slate-200 text-xs font-bold w-full"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={
                    setCategoryFilter
                  }
                >
                  <SelectTrigger className="h-9 w-[120px] rounded-lg bg-slate-50 border-slate-200 text-xs font-bold">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem
                      value="all"
                      className="text-xs font-bold"
                    >
                      All
                    </SelectItem>
                    <SelectItem
                      value="selected"
                      className="text-xs font-bold"
                    >
                      Selected
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const isSelected =
                  formData.category_ids.includes(
                    cat.id,
                  );
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      toggleCategory(cat.id)
                    }
                    className={cn(
                      "flex flex-col items-center p-4 rounded-xl border-2 transition-all group",
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center mb-3",
                        isSelected
                          ? "bg-white/10"
                          : "bg-slate-50",
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Plus className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
              {filteredCategories.length ===
                0 && (
                <div className="col-span-full py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  No matching categories found
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" />{" "}
              Media Gallery
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {formData.images.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-100"
                >
                  <img
                    src={url}
                    className="w-full h-full object-cover"
                    alt="Product"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 h-6 w-6 bg-black/60 rounded flex items-center justify-center text-white hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {formData.images.length < 8 && (
                <Label className="aspect-square rounded-lg border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Plus className="h-6 w-6 text-slate-300" />
                  )}
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    UPLOAD
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </Label>
              )}
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-none rounded-lg p-6 bg-white overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <QrCode className="h-3.5 w-3.5" />{" "}
              Barcode ID
            </h3>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <QRCodeSVG
                  value={formData.barcode}
                  size={140}
                  level="M"
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  STOCK ID
                </p>
                <p className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">
                  {formData.barcode}
                </p>
              </div>
            </div>
          </Card>

          <div className="p-6 rounded-lg bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Status Verification
              </p>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              disabled={loading || uploading}
              className="w-full h-14 bg-slate-900 border-none text-white font-black uppercase text-[11px] tracking-widest rounded-lg shadow-xl hover:bg-black transition-all"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />{" "}
                  SAVE CHANGES
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full h-12 border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-slate-50"
            >
              DISCARD
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function SellerProductEditPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Initializing Editor...
          </p>
        </div>
      }
    >
      <EditProductForm />
    </Suspense>
  );
}
