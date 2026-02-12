"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

const supabase = createClient();

export default function AddProductPage() {
  const router = useRouter();
  const { user, refreshSellerProducts } =
    useUser();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    any[]
  >([]);
  const [shop, setShop] = useState<any>(null);
  const [uploading, setUploading] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_qty: "",
    category_id: "",
    images: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // 1. Get Shop
      const { data: shopData } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      setShop(shopData);

      // 2. Get Categories
      try {
        const { data: catData, error: catError } =
          await supabase
            .from("categories")
            .select("*")
            .order("name");
        if (catError) {
          console.error(
            "Category Fetch Error:",
            catError,
          );
          toast.error(
            "Failed to load categories. Please refresh.",
          );
        }
        setCategories(catData || []);
      } catch (err) {
        console.error(
          "Unexpected Category Error:",
          err,
        );
      }
    };
    fetchData();
  }, [user?.id]);

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

        const bucketName = "shop-profiles"; // Using verified bucket
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
    if (!shop || !user) return;

    if (
      !formData.name ||
      !formData.price ||
      !formData.stock_qty ||
      !formData.category_id
    ) {
      toast.error(
        "Please fill in all required fields",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .insert({
          shop_id: shop.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock_qty: parseInt(formData.stock_qty),
          category_id: formData.category_id,
          images: formData.images,
          status: "active",
        });

      if (error) throw error;

      await refreshSellerProducts();
      toast.success(
        "Product added successfully!",
      );
      router.push(
        "/core/transaction2/seller/products",
      );
    } catch (error: any) {
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

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
            Add New Product
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            Listing your product in the
            marketplace
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white">
          <div className="grid gap-8">
            {/* Basic Info */}
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
                    placeholder="Enter product title..."
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
                    placeholder="Detailed description of your product..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
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
                  placeholder="0.00"
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
                  placeholder="0"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Category *
              </Label>
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: e.target.value,
                  })
                }
                className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus:ring-2 focus:ring-amber-500/20 outline-none appearance-none"
              >
                <option value="">
                  Select a category
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Images Section */}
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
            Add Product to Shop
          </Button>
        </div>
      </form>
    </div>
  );
}
