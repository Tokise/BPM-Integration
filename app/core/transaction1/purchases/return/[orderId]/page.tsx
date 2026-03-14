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
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitReturnRequest } from "@/app/actions/returns";
import { toast } from "sonner";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

        if (data.status !== "delivered") {
          toast.error(
            "Only delivered orders can be returned",
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
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
        <Link
          href="/core/transaction1/purchases"
          className="hover:text-primary transition-colors"
        >
          PURCHASES
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          REQUEST RETURN
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Request Return
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            Order #
            {order.order_number ||
              order.id.slice(0, 8)}{" "}
            • Registered{" "}
            {new Date(
              order.created_at,
            ).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Summary Card */}
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <Package className="h-4 w-4 mt-8" />
                <p className="mt-8">
                  Items to Return
                </p>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-slate-100 p-1">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-full w-full object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm leading-tight">
                            {item.product_name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {
                              item.product_category
                            }
                          </p>
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          ₱
                          {item.price_at_purchase.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black h-5 uppercase tracking-widest border-slate-200"
                        >
                          Quantity:{" "}
                          {item.quantity}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Item ID:{" "}
                          {item.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Return Method */}
              <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
                  <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                    <Truck className="h-4 w-4" />
                    Dispatch Option
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup
                    value={returnMethod}
                    onValueChange={
                      setReturnMethod
                    }
                    className="space-y-3"
                  >
                    <Label
                      htmlFor="pickup"
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                        returnMethod === "pickup"
                          ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/50",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            returnMethod ===
                              "pickup"
                              ? "bg-white/10"
                              : "bg-white border border-slate-100 text-slate-500",
                          )}
                        >
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-[11px] uppercase tracking-widest">
                            Courier Pickup
                          </p>
                          <p
                            className={cn(
                              "text-[9px] font-bold",
                              returnMethod ===
                                "pickup"
                                ? "text-slate-400"
                                : "text-slate-400",
                            )}
                          >
                            Address Dispatch
                          </p>
                        </div>
                      </div>
                      <RadioGroupItem
                        value="pickup"
                        id="pickup"
                        className="sr-only"
                      />
                      {returnMethod ===
                        "pickup" && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </Label>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Status/Condition Information */}
              <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
                  <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                    <Archive className="h-4 w-4" />
                    Condition Detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Packaging Status
                      </Label>
                      <Select
                        value={packagingCondition}
                        onValueChange={
                          setPackagingCondition
                        }
                      >
                        <SelectTrigger className="w-full rounded-lg border-slate-200 h-10 px-3 font-black text-[10px] uppercase tracking-widest bg-slate-50/30 focus:ring-0">
                          <SelectValue placeholder="STATUS" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                          <SelectItem
                            value="original_sealed"
                            className="text-[10px] font-black uppercase"
                          >
                            Original Sealed
                          </SelectItem>
                          <SelectItem
                            value="original_opened"
                            className="text-[10px] font-black uppercase"
                          >
                            Original Opened
                          </SelectItem>
                          <SelectItem
                            value="repackaged_secure"
                            className="text-[10px] font-black uppercase"
                          >
                            Repackaged
                          </SelectItem>
                          <SelectItem
                            value="damaged_packaging"
                            className="text-[10px] font-black uppercase"
                          >
                            Damaged Box
                          </SelectItem>
                          <SelectItem
                            value="no_packaging"
                            className="text-[10px] font-black uppercase"
                          >
                            No Box
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Return Reason - Large Full Width */}
            <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
                <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                  <AlertCircle className="h-4 w-4" />
                  Request Justification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                      Primary Reason
                    </Label>
                    <Select
                      value={returnReason}
                      onValueChange={
                        setReturnReason
                      }
                    >
                      <SelectTrigger className="w-full rounded-lg border-slate-200 h-14 px-4 font-black text-xs uppercase tracking-[0.1em] bg-slate-50/30 focus:ring-0">
                        <SelectValue placeholder="SELECT REASON FOR RETURN" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                        <SelectItem
                          value="damaged"
                          className="text-[11px] font-black uppercase"
                        >
                          Damaged Item
                        </SelectItem>
                        <SelectItem
                          value="wrong_item"
                          className="text-[11px] font-black uppercase"
                        >
                          Wrong Item
                        </SelectItem>
                        <SelectItem
                          value="missing_parts"
                          className="text-[11px] font-black uppercase"
                        >
                          Missing Parts
                        </SelectItem>
                        <SelectItem
                          value="not_as_described"
                          className="text-[11px] font-black uppercase"
                        >
                          Not as Described
                        </SelectItem>
                        <SelectItem
                          value="performance_issue"
                          className="text-[11px] font-black uppercase"
                        >
                          Quality Issue
                        </SelectItem>
                        <SelectItem
                          value="other"
                          className="text-[11px] font-black uppercase"
                        >
                          Other Reason
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Uploads & Actions */}
        <div className="space-y-6  lg:top-8">
          {/* Uploads Card */}
          <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <Camera className="h-4 w-4" />
                Visual Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <label className="aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-600 cursor-pointer transition-all relative group overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) =>
                      handleFileUpload(e, "image")
                    }
                  />
                  <Camera className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">
                    {isUploading
                      ? "Uploading..."
                      : "Add Photo"}
                  </span>
                </label>

                <label className="aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-600 cursor-pointer transition-all relative group overflow-hidden">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) =>
                      handleFileUpload(e, "video")
                    }
                  />
                  <VideoIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">
                    {isUploading
                      ? "Uploading..."
                      : "Add Video"}
                  </span>
                </label>
              </div>

              {/* Proof Gallery */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Evidence Loop (
                    {proofUrls.length})
                  </span>
                  {proofUrls.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setProofUrls([])
                      }
                      className="h-6 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2"
                    >
                      Purge
                    </Button>
                  )}
                </div>

                {proofUrls.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                    <AlertCircle className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
                      No Data Staged
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {proofUrls.map((url, i) => {
                      const isVideo = url.match(
                        /\.(mp4|webm|ogg|mov)$|^.*video.*$/i,
                      );
                      return (
                        <div
                          key={i}
                          className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group"
                        >
                          {isVideo ? (
                            <div className="h-full w-full flex items-center justify-center bg-slate-900">
                              <VideoIcon className="h-6 w-6 text-white/30" />
                            </div>
                          ) : (
                            <img
                              src={url}
                              alt="Proof"
                              className="h-full w-full object-cover"
                            />
                          )}

                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                openPreview(url)
                              }
                              className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-xl hover:scale-105 transition-transform"
                            >
                              {isVideo ? (
                                <Play className="h-4 w-4 fill-current" />
                              ) : (
                                <RefreshCcw className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveProof(
                                  url,
                                )
                              }
                              className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !order}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg h-12 mt-8 text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all border-none"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Deploy Request
                  </>
                )}
              </Button>
            </CardContent>
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
