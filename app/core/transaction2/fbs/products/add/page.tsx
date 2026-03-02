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
  Warehouse,
  QrCode,
  Truck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const supabase = createClient();

// Auto-generate unique barcode
function generateBarcode() {
  const ts = Date.now();
  const rand = Math.floor(
    1000 + Math.random() * 9000,
  );
  return `FBS-${ts}-${rand}`;
}

export default function AddFBSProductPage() {
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
    outbound_qty: "",
    category_ids: [] as string[],
    images: [] as string[],
    low_stock_threshold: "10",
    barcode: generateBarcode(),
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // 1. Get Shop
      const { data: shopData } = await supabase
        .schema("bpm-anec-global")
        .from("shops")
        .select("id, name")
        .eq("owner_id", user.id)
        .single();
      setShop(shopData);

      // 2. Get Categories
      try {
        const { data: catData, error: catError } =
          await supabase
            .schema("bpm-anec-global")
            .from("categories")
            .select("*")
            .order("name");
        if (catError) {
          toast.error(
            "Failed to load categories.",
          );
        }
        setCategories(catData || []);
      } catch (err) {
        console.error(
          "Category fetch error:",
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
    if (!shop || !user) return;

    if (
      !formData.name ||
      !formData.price ||
      !formData.outbound_qty ||
      formData.category_ids.length === 0
    ) {
      toast.error(
        "Please fill in name, price, outbound quantity, and at least one category",
      );
      return;
    }

    setLoading(true);
    try {
      const primaryCategoryId =
        formData.category_ids[0];

      const { data: newProduct, error } =
        await supabase
          .schema("bpm-anec-global")
          .from("products")
          .insert({
            shop_id: shop.id,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock_qty: 0, // FBS: stock starts at 0
            images: formData.images,
            barcode: formData.barcode,
            category_id: primaryCategoryId,
            low_stock_threshold: parseInt(
              formData.low_stock_threshold,
            ),
            status: "active",
          })
          .select()
          .single();

      if (error) throw error;

      // Insert category links
      if (formData.category_ids.length > 0) {
        const { error: linkError } =
          await supabase
            .schema("bpm-anec-global")
            .from("product_category_links")
            .insert(
              formData.category_ids.map(
                (catId) => ({
                  product_id: newProduct.id,
                  category_id: catId,
                }),
              ),
            );
        if (linkError) throw linkError;
      }

      // Create procurement entry for outbound shipment tracking
      const outboundQty = parseInt(
        formData.outbound_qty,
      );
      if (outboundQty > 0) {
        const { error: procError } =
          await supabase
            .schema("bpm-anec-global")
            .from("procurement")
            .insert({
              product_id: newProduct.id,
              supplier_name:
                shop?.name || "FBS Seller",
              quantity: outboundQty,
              status: "fbs_pickup_requested",
            });
        if (procError)
          console.error(
            "Procurement entry error:",
            procError,
          );
      }

      await refreshSellerProducts();
      toast.success("FBS Product Added!", {
        description: `Outbound shipment of ${outboundQty} units created. Stock will update once warehouse verifies receipt.`,
      });
      router.push(
        "/core/transaction2/fbs/products",
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
            Add FBS Product
          </h1>
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">
            Specify stock to ship — warehouse
            verifies on receipt
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
                <Package className="h-5 w-5 text-blue-500" />
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
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus-visible:ring-blue-500/20"
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
                    className="min-h-[160px] rounded-[32px] bg-slate-50 border-none font-medium text-slate-600 resize-none p-6 focus-visible:ring-blue-500/20"
                    placeholder="Detailed description of your product..."
                  />
                </div>
              </div>
            </div>

            {/* Price */}
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
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 px-6 focus-visible:ring-blue-500/20"
                placeholder="0.00"
              />
            </div>

            {/* Outbound Shipment */}
            <Card className="p-6 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-[32px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Outbound Shipment
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400">
                    How many units are you
                    shipping to the warehouse?
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Outbound Quantity *
                  </Label>
                  <Input
                    type="number"
                    value={formData.outbound_qty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outbound_qty:
                          e.target.value,
                      })
                    }
                    className="h-14 rounded-2xl bg-white border-none font-bold text-slate-900 px-6 focus-visible:ring-blue-500/20"
                    placeholder="0"
                    min="1"
                  />
                  <p className="text-[9px] font-bold text-blue-500 px-1">
                    Stock will remain at 0 until
                    the warehouse scans & verifies
                    receipt
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <Package className="h-3 w-3 text-blue-500" />
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Low Stock Level
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
                    className="h-14 rounded-2xl bg-white border-none font-bold text-slate-900 px-6 focus-visible:ring-blue-500/20"
                    placeholder="10"
                  />
                  <p className="text-[9px] font-bold text-slate-400 px-1">
                    Notify when warehouse stock
                    falls below this level
                  </p>
                </div>
              </div>
            </Card>

            {/* Category */}
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
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-600"
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
                          ? "bg-blue-500 border-blue-500"
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

            {/* Barcode QR Code */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <QrCode className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Product Barcode
                </h3>
              </div>
              <div className="flex items-center gap-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100/50">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <QRCodeSVG
                    value={formData.barcode}
                    size={120}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Auto-Generated Barcode
                  </p>
                  <p className="text-lg font-mono font-bold text-slate-900">
                    {formData.barcode}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    Scan QR code to identify this
                    product in the warehouse
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        barcode:
                          generateBarcode(),
                      })
                    }
                    className="h-8 px-3 text-xs font-bold text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    Regenerate Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Images Section */}
        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="h-5 w-5 text-blue-500" />
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
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              ) : (
                <Plus className="h-8 w-8 text-slate-200 group-hover:text-blue-500 transition-colors" />
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
            Add to FBS Catalog
          </Button>
        </div>
      </form>
    </div>
  );
}
