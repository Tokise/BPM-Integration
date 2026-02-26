"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Camera,
  Video as VideoIcon,
  Archive,
  Truck,
  RefreshCcw,
  Loader2,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitReturnRequest } from "@/app/actions/returns";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  product_category: string;
  quantity: number;
  price_at_purchase: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function ReturnRequestPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const router = useRouter();
  const { orderId } = use(params);
  const supabase = createClient();
  const { user, loading: authLoading } =
    useUser();

  const [order, setOrder] =
    useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isUploading, setIsUploading] =
    useState(false);

  const [returnReason, setReturnReason] =
    useState("");
  const [returnMethod, setReturnMethod] =
    useState("pickup");
  const [
    packagingCondition,
    setPackagingCondition,
  ] = useState("");
  const [proofUrls, setProofUrls] = useState<
    string[]
  >([]);

  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);
  const [previewType, setPreviewType] = useState<
    "image" | "video" | null
  >(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();

        if (error) throw error;

        if (data.status !== "completed") {
          toast.error(
            "Only completed orders can be returned",
          );
          router.push(
            "/core/transaction1/purchases",
          );
          return;
        }

        setOrder(data);
      } catch (error: any) {
        console.error(
          "Error fetching order:",
          error,
        );
        toast.error(
          "Failed to load order details",
        );
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push("/auth/sign-in");
      } else {
        fetchOrder();
      }
    }
  }, [user, authLoading, orderId]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `returns/${orderId}/${type}_${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("return-proofs")
          .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("return-proofs")
        .getPublicUrl(filePath);

      setProofUrls((prev) => [
        ...prev,
        publicUrl,
      ]);
      toast.success(
        `${type} uploaded successfully`,
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(
        `Upload failed: ${error.message}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProof = (
    urlToRemove: string,
  ) => {
    setProofUrls((prev) =>
      prev.filter((url) => url !== urlToRemove),
    );
  };

  const handleSubmit = async () => {
    if (!returnReason.trim()) {
      toast.error(
        "Please provide a reason for return",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReturnRequest({
        orderId: orderId,
        reason: returnReason,
        returnMethod,
        proofUrls: proofUrls,
        packagingCondition,
      });

      if (result.success) {
        toast.success(
          "Return request submitted successfully",
        );
        router.push(
          "/core/transaction1/purchases?status=refund",
        );
      } else {
        toast.error(
          result.error ||
            "Failed to submit request",
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPreview = (url: string) => {
    const isVideo = url.match(
      /\.(mp4|webm|ogg|mov)$|^.*video.*$/i,
    );
    setPreviewUrl(url);
    setPreviewType(isVideo ? "video" : "image");
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-slate-500 font-bold">
          Loading order details...
        </p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Request Return
          </h1>
          <p className="text-slate-500 font-bold mt-1">
            Order #{order.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Summary Card */}
          <Card className="p-6 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
              Items to Return
            </h3>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-slate-50 rounded-2xl"
                >
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-slate-100">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {item.product_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      {item.product_category}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        ₱
                        {item.price_at_purchase.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Form Card */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-3xl space-y-8">
            {/* Return Method */}
            <div className="space-y-4">
              <Label className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" />
                Return Method
              </Label>
              <RadioGroup
                value={returnMethod}
                onValueChange={setReturnMethod}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="pickup"
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    returnMethod === "pickup"
                      ? "border-orange-500 bg-orange-50/30"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        returnMethod === "pickup"
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">
                        Courier Pickup
                      </p>
                      <p className="text-xs font-bold text-slate-400">
                        Courier fetches from your
                        address
                      </p>
                    </div>
                  </div>
                  <RadioGroupItem
                    value="pickup"
                    id="pickup"
                    className="sr-only"
                  />
                  {returnMethod === "pickup" && (
                    <CheckCircle2 className="h-5 w-5 text-orange-500" />
                  )}
                </Label>
              </RadioGroup>
            </div>

            {/* Return Reason */}
            <div className="space-y-4">
              <Label className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Return Reason
              </Label>
              <Select
                value={returnReason}
                onValueChange={setReturnReason}
              >
                <SelectTrigger className="w-full rounded-2xl border-2 border-slate-100 focus:border-orange-500 focus:ring-0 font-bold text-slate-700 bg-slate-50/30 h-14 px-4">
                  <SelectValue placeholder="Select a reason for return" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="damaged">
                    Damaged or defective item
                  </SelectItem>
                  <SelectItem value="wrong_item">
                    Received wrong item
                  </SelectItem>
                  <SelectItem value="missing_parts">
                    Missing parts or accessories
                  </SelectItem>
                  <SelectItem value="not_as_described">
                    Item not as described/pictured
                  </SelectItem>
                  <SelectItem value="performance_issue">
                    Item does not work properly
                  </SelectItem>
                  <SelectItem value="other">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Packaging Condition */}
            <div className="space-y-4">
              <Label className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Archive className="h-5 w-5 text-orange-500" />
                Packaging Condition
              </Label>
              <Select
                value={packagingCondition}
                onValueChange={
                  setPackagingCondition
                }
              >
                <SelectTrigger className="w-full rounded-2xl border-2 border-slate-100 focus:border-orange-500 focus:ring-0 font-bold text-slate-700 bg-slate-50/30 h-14 px-4">
                  <SelectValue placeholder="Select packaging condition" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="original_sealed">
                    Original packaging,
                    unopened/sealed
                  </SelectItem>
                  <SelectItem value="original_opened">
                    Original packaging, opened
                  </SelectItem>
                  <SelectItem value="repackaged_secure">
                    Repackaged securely (bubble
                    wrap/new box)
                  </SelectItem>
                  <SelectItem value="damaged_packaging">
                    Original packaging is damaged
                  </SelectItem>
                  <SelectItem value="no_packaging">
                    No protective packaging
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Right Column: Uploads & Stats */}
        <div className="space-y-8">
          {/* Uploads Card */}
          <Card className="p-5 w-full border-none shadow-xl shadow-slate-200/50 rounded-2xl top-24">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Camera className="h-5 w-5 text-orange-500" />
              Proof of Condition
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <label className="aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/50 cursor-pointer transition-all relative group overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) =>
                    handleFileUpload(e, "image")
                  }
                />
                <Camera className="h-8 w-8 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">
                  {isUploading
                    ? "Uploading..."
                    : "Add Image"}
                </span>
              </label>

              <label className="aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/50 cursor-pointer transition-all relative group overflow-hidden">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) =>
                    handleFileUpload(e, "video")
                  }
                />
                <VideoIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">
                  {isUploading
                    ? "Uploading..."
                    : "Add Video"}
                </span>
              </label>
            </div>

            {/* Proof Gallery */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase">
                  Gallery ({proofUrls.length})
                </span>
                {proofUrls.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setProofUrls([])
                    }
                    className="h-7 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {proofUrls.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">
                    No proofs uploaded yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {proofUrls.map((url, i) => {
                    const isVideo = url.match(
                      /\.(mp4|webm|ogg|mov)$|^.*video.*$/i,
                    );
                    return (
                      <div
                        key={i}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-slate-200 border border-slate-100 group shadow-sm"
                      >
                        {isVideo ? (
                          <div className="h-full w-full flex items-center justify-center bg-slate-900">
                            <VideoIcon className="h-8 w-8 text-white/50" />
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt="Proof"
                            className="h-full w-full object-cover"
                          />
                        )}

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              openPreview(url)
                            }
                            className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg hover:scale-110 transition-transform"
                          >
                            {isVideo ? (
                              <Play className="h-5 w-5 fill-current" />
                            ) : (
                              <RefreshCcw className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleRemoveProof(
                                url,
                              )
                            }
                            className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {isVideo && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-black text-white uppercase tracking-tighter">
                            Video
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !order}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl h-14 mt-8 shadow-lg shadow-orange-100 text-lg transition-all active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <RefreshCcw className="h-5 w-5 mr-2" />
                  Submit Return
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>

      {/* Lightbox / Preview Overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4 md:p-12 animate-in fade-in duration-300">
          <button
            onClick={() => {
              setPreviewUrl(null);
              setPreviewType(null);
            }}
            className="absolute top-8 right-8 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-7 w-7" />
          </button>

          <div className="max-w-4xl w-full h-full flex items-center justify-center">
            {previewType === "video" ? (
              <video
                src={previewUrl}
                className="max-h-full max-w-full rounded-2xl shadow-2xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
