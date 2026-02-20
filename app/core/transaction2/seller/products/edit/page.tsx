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
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { checkLowStock } from "@/app/actions/notifications";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";

const supabase = createClient();

function EditProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { user, refreshSellerProducts } =
    useUser();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    any[]
  >([]);
  const [shop, setShop] = useState<any>(null);
  const [uploading, setUploading] =
    useState(false);
  const [initialLoading, setInitialLoading] =
    useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_qty: "",
    low_stock_threshold: "5",
    category_ids: [] as string[],
    images: [] as string[],
    status: "active",
  });

  useEffect(() => {
    if (!productId) {
      toast.error("No product ID provided");
      router.push(
        "/core/transaction2/seller/products",
      );
      return;
    }

    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // 1. Get Shop
        const { data: shopData } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .single();
        setShop(shopData);

        // 2. Get Categories
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .order("name");
        setCategories(catData || []);

        // 3. Get Product Details
        const {
          data: product,
          error: productError,
        } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (productError) throw productError;

        // 4. Get Current Category Links
        const { data: currentLinks } =
          await supabase
            .schema("bpm-anec-global")
            .from("product_category_links")
            .select("category_id")
            .eq("product_id", productId);

        if (product) {
          setFormData({
            name: product.name,
            description:
              product.description || "",
            price: product.price.toString(),
            stock_qty:
              product.stock_qty.toString(),
            low_stock_threshold: (
              product.low_stock_threshold ?? 5
            ).toString(),
            category_ids: currentLinks
              ? currentLinks.map(
                  (l) => l.category_id,
                )
              : [],
            images: product.images || [],
            status: product.status || "active",
          });
        }
      } catch (error: any) {
        console.error(
          "Error fetching data:",
          error,
        );
        toast.error(
          "Failed to load product details",
        );
        router.push(
          "/core/transaction2/seller/products",
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [user?.id, productId, router]);

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
        const bucketName = "shop-profiles";

        const { error: uploadError } =
          await supabase.storage
            .from(bucketName)
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }
      setFormData({
        ...formData,
        images: newImages,
      });
      toast.success(
        "Images uploaded successfully",
      );
    } catch (error: any) {
      toast.error("Failed to upload images");
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
        "Please fill in all required fields including at least one category",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock_qty: parseInt(formData.stock_qty),
          low_stock_threshold: parseInt(
            formData.low_stock_threshold,
          ),
          images: formData.images,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;

      // Sync Categories
      // 1. Remove old links
      await supabase
        .schema("bpm-anec-global")
        .from("product_category_links")
        .delete()
        .eq("product_id", productId);

      // 2. Insert new links
      if (formData.category_ids.length > 0) {
        const { error: linkError } =
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
        if (linkError) throw linkError;
      }

      await checkLowStock(productId);
      await refreshSellerProducts();
      toast.success(
        "Product updated successfully!",
      );
      router.push(
        "/core/transaction2/seller/products",
      );
    } catch (error: any) {
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="h-12 w-12 rounded-2xl p-0 hover:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6 text-slate-900" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            Edit Product
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            Update your product details and
            settings
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white">
          <div className="grid gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Product Details
                </h3>
              </div>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Product Name *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description:
                          e.target.value,
                      })
                    }
                    className="min-h-[160px] rounded-[32px] bg-slate-50 border-none font-medium text-slate-600 resize-none p-6 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Price (PHP) *
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
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Stock Quantity *
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
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus-visible:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Categories (Select multiple) *
                </Label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-6 rounded-[32px] max-h-[200px] overflow-y-auto no-scrollbar border border-slate-100/50">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                        formData.category_ids.includes(
                          cat.id,
                        )
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                          : "bg-white border-transparent text-slate-500 hover:border-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.category_ids.includes(
                          cat.id,
                        )}
                        onChange={(e) => {
                          const newCats = e.target
                            .checked
                            ? [
                                ...formData.category_ids,
                                cat.id,
                              ]
                            : formData.category_ids.filter(
                                (id) =>
                                  id !== cat.id,
                              );
                          setFormData({
                            ...formData,
                            category_ids: newCats,
                          });
                        }}
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          formData.category_ids.includes(
                            cat.id,
                          )
                            ? "bg-amber-500 border-amber-500"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {formData.category_ids.includes(
                          cat.id,
                        ) && (
                          <Plus className="h-3 w-3 text-white rotate-45" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Low Stock Level *
                  </Label>
                </div>
                <Input
                  type="number"
                  value={
                    formData.low_stock_threshold
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      low_stock_threshold:
                        e.target.value,
                    })
                  }
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus-visible:ring-amber-500/20"
                />
                <p className="text-[9px] font-bold text-slate-400 px-1">
                  Notify me when stock falls below
                  this level
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Product Images
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-[32px] overflow-hidden group"
              >
                <img
                  src={url}
                  className="w-full h-full object-cover"
                  alt="Product"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 h-8 w-8 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Label className="aspect-square rounded-[32px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors group">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              ) : (
                <Plus className="h-8 w-8 text-slate-200 group-hover:text-amber-500 transition-colors" />
              )}
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Upload Image
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
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="h-16 flex-1 rounded-[32px] font-black uppercase text-xs tracking-widest text-slate-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-16 flex-[2] rounded-[32px] bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <EditProductForm />
    </Suspense>
  );
}
