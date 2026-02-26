"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import { useUser } from "@/context/UserContext";
import { processReturnRefund } from "@/app/actions/returns";
import {
  getSellerCancellations,
  getSellerReturns,
  handleCancellationRequest,
} from "@/app/actions/seller";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RotateCcw,
  AlertCircle,
  Search,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Coins,
  User,
  Mail,
  Info,
  Camera,
  Video,
  Eye,
  Play,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReturnsWorkflowPage() {
  const supabase = createClient();
  const { shopId } = useUser();
  const [cancellations, setCancellations] =
    useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] =
    useState<any>(null);
  const [refundAmount, setRefundAmount] =
    useState<string>("");
  const [sellerNotes, setSellerNotes] =
    useState<string>("");

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);

    try {
      // Fetch Cancellations (Pre-delivery) via Server Action (bypassing RLS)
      const cancelRes =
        await getSellerCancellations(shopId);
      if (cancelRes.success && cancelRes.data) {
        setCancellations(cancelRes.data as any[]);
      } else if (cancelRes.error) {
        console.error(
          "Error fetching cancellations:",
          cancelRes.error,
        );
      }

      // Fetch Returns (Post-delivery) via Server Action (bypassing RLS)
      const returnsRes =
        await getSellerReturns(shopId);
      if (returnsRes.success && returnsRes.data) {
        setReturns(returnsRes.data as any[]);
      } else if (returnsRes.error) {
        console.error(
          "Error fetching returns:",
          returnsRes.error,
        );
      }
    } catch (error) {
      console.error(
        "Unexpected error fetching data:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time listener for cancellations and returns
  useEffect(() => {
    if (!shopId) return;

    const cancellationsChannel = supabase
      .channel(
        `seller-cancellations-realtime-${shopId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "order_cancellations",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    const returnsChannel = supabase
      .channel(
        `seller-returns-realtime-${shopId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "order_returns",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        cancellationsChannel,
      );
      supabase.removeChannel(returnsChannel);
    };
  }, [shopId, fetchData]);

  const handleRefundPoints = async (
    amount: number,
  ) => {
    if (!selectedReturn) return;

    const toastId = toast.loading(
      "Processing refund and point transfer...",
    );

    try {
      const result = await processReturnRefund({
        returnId: selectedReturn.id,
        orderId: selectedReturn.order_id,
        customerId:
          selectedReturn.orders.customer_id,
        amount: amount,
        sellerNotes: sellerNotes,
      });

      if (result.success) {
        toast.success(
          `Successfully refunded ${amount} points to customer`,
          { id: toastId },
        );
        setSelectedReturn(null);
        fetchData();
      } else {
        toast.error(
          result.error ||
            "Failed to process refund",
          { id: toastId },
        );
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          "An unexpected error occurred",
        { id: toastId },
      );
    }
  };

  const handleCancelAction = async (
    cancellationId: string,
    orderId: string,
    action: "approve" | "reject",
  ) => {
    const toastId = toast.loading(
      `${
        action === "approve"
          ? "Approving"
          : "Rejecting"
      } cancellation...`,
    );

    try {
      const result =
        await handleCancellationRequest(
          cancellationId,
          orderId,
          action,
        );
      if (result.success) {
        toast.success(
          `Cancellation ${action}d successfully`,
          { id: toastId },
        );
        fetchData();
      } else {
        toast.error(
          result.error ||
            `Failed to ${action} cancellation`,
          { id: toastId },
        );
      }
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  // State for proof preview
  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);
  const [previewType, setPreviewType] = useState<
    "image" | "video" | null
  >(null);

  const openPreview = (url: string) => {
    const isVideo = url.match(
      /\.(mp4|webm|ogg|mov)$|^.*video.*$/i,
    );
    setPreviewUrl(url);
    setPreviewType(isVideo ? "video" : "image");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Returns Workflow
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Manage cancellations and refund requests
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Pending Cancellations
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900">
                  {
                    cancellations.filter(
                      (c) =>
                        c.status ===
                        "pending_review",
                    ).length
                  }
                </p>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                  Pre-delivery
                </span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Pending Returns
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900">
                  {
                    returns.filter(
                      (r) =>
                        r.status === "pending",
                    ).length
                  }
                </p>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">
                  Post-delivery
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs
        defaultValue="returns"
        className="space-y-8"
      >
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
          <TabsTrigger
            value="returns"
            className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Returns (Post-Delivery)
          </TabsTrigger>
          <TabsTrigger
            value="cancellations"
            className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Cancellations (Pre-Delivery)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="returns">
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black">
                Post-Delivery Refund Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-20 text-center text-slate-400 font-bold tracking-widest text-xs animate-pulse">
                  Scanning returns...
                </div>
              ) : returns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Order ID
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Customer
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Reason
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Total
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {returns.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-6 font-bold text-slate-900">
                            #
                            {r.orders
                              ?.order_number ||
                              "N/A"}
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">
                                {r.orders
                                  ?.customer
                                  ?.full_name ||
                                  "Unknown"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {r.orders
                                  ?.customer
                                  ?.email ||
                                  "No email"}
                              </span>
                            </div>
                          </td>
                          <td className="p-6 text-sm text-slate-500 max-w-xs capitalize">
                            {r.reason?.replace(
                              "_",
                              " ",
                            )}
                          </td>
                          <td className="p-6 font-black text-slate-900">
                            ₱
                            {r.orders?.total_amount?.toLocaleString()}
                          </td>
                          <td className="p-6 uppercase">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded ${
                                r.status ===
                                "approved"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : r.status ===
                                      "rejected"
                                    ? "bg-rose-50 text-rose-600"
                                    : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            {r.status ===
                              "pending" && (
                              <Button
                                onClick={() => {
                                  setSelectedReturn(
                                    r,
                                  );
                                  setRefundAmount(
                                    r.orders.total_amount.toString(),
                                  );
                                }}
                                className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase rounded-lg h-8"
                              >
                                Review & Refund
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center flex flex-col items-center">
                  <RotateCcw className="h-16 w-16 text-slate-100 mb-6" />
                  <h3 className="text-xl font-black text-slate-900">
                    No Return Requests
                  </h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancellations">
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black">
                Pre-Delivery Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cancellations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Order ID
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Customer
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Reason
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {cancellations.map((c) => (
                        <tr key={c.id}>
                          <td className="p-6 font-bold text-slate-900">
                            #
                            {c.orders
                              ?.order_number ||
                              "N/A"}
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">
                                {c.orders
                                  ?.customer
                                  ?.full_name ||
                                  "Unknown"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {c.orders
                                  ?.customer
                                  ?.email ||
                                  "No email"}
                              </span>
                            </div>
                          </td>
                          <td className="p-6 text-sm text-slate-500">
                            {c.reason}
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-[10px] font-black rounded uppercase w-fit",
                                  c.status ===
                                    "approved"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : c.status ===
                                        "rejected"
                                      ? "bg-rose-50 text-rose-600"
                                      : "bg-amber-50 text-amber-600",
                                )}
                              >
                                {c.status?.replace(
                                  "_",
                                  " ",
                                )}
                              </span>
                              {c.orders
                                ?.status ===
                                "cancel_pending" && (
                                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter">
                                  Action Required
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            {c.status ===
                              "pending_review" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[10px] font-black uppercase border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                  onClick={() =>
                                    handleCancelAction(
                                      c.id,
                                      c.order_id,
                                      "approve",
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[10px] font-black uppercase border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                  onClick={() =>
                                    handleCancelAction(
                                      c.id,
                                      c.order_id,
                                      "reject",
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center flex flex-col items-center">
                  <XCircle className="h-16 w-16 text-slate-100 mb-6" />
                  <h3 className="text-xl font-black text-slate-900">
                    No Cancellations
                  </h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <Dialog
        open={!!selectedReturn}
        onOpenChange={(open) =>
          !open && setSelectedReturn(null)
        }
      >
        <DialogContent className="mt-10 sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-2">
                    Review Return Request
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-400 mt-1">
                    Assessment for Order #
                    {
                      selectedReturn?.orders
                        ?.order_number
                    }
                  </DialogDescription>
                </div>
                <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  <span className="font-black text-sm">
                    Transfer Points
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Info & Details */}
              <div className="space-y-6">
                {/* Customer Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <User className="h-3 w-3" />{" "}
                    Customer Information
                  </label>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-black text-slate-900 text-lg">
                      {selectedReturn?.orders
                        ?.customer?.full_name ||
                        "Unknown Customer"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-slate-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-bold">
                        {selectedReturn?.orders
                          ?.customer?.email ||
                          "No email available"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Return Details Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Info className="h-3 w-3" />{" "}
                    Return Details
                  </label>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Return Method
                      </span>
                      <span className="text-xs font-black text-slate-900 uppercase bg-white px-2 py-1 rounded-lg border border-slate-100 italic">
                        {selectedReturn?.return_method ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Packaging
                      </span>
                      <span className="text-xs font-black text-slate-900 uppercase">
                        {selectedReturn?.packaging_condition?.replace(
                          /_/g,
                          " ",
                        ) || "N/A"}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200/50">
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                        Reason
                      </span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed capitalize">
                        {selectedReturn?.reason?.replace(
                          /_/g,
                          " ",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Media Proofs */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Camera className="h-3 w-3" />{" "}
                  Media Proofs (
                  {selectedReturn?.proof_urls
                    ?.length || 0}
                  )
                </label>

                {selectedReturn?.proof_urls &&
                selectedReturn.proof_urls.length >
                  0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReturn.proof_urls.map(
                      (
                        url: string,
                        i: number,
                      ) => {
                        const isVideo = url.match(
                          /\.(mp4|webm|ogg|mov)$|^.*video.*$/i,
                        );
                        return (
                          <div
                            key={i}
                            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group cursor-pointer"
                            onClick={() =>
                              openPreview(url)
                            }
                          >
                            {isVideo ? (
                              <div className="h-full w-full flex items-center justify-center bg-slate-900">
                                <Play className="h-8 w-8 text-white/50 group-hover:scale-110 transition-transform" />
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[8px] font-black text-white uppercase">
                                  Video
                                </div>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt="Proof"
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="h-[200px] rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Camera className="h-10 w-10 opacity-20" />
                    <span className="text-xs font-black uppercase tracking-widest opacity-40">
                      No proofs provided
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Refund Action Section */}
            <div className="pt-8 border-t border-slate-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Refund Point Amount
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                      ₱
                    </div>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={(e) =>
                        setRefundAmount(
                          e.target.value,
                        )
                      }
                      className="rounded-2xl border-slate-100 h-14 pl-8 text-lg font-black focus-visible:ring-amber-500 bg-slate-50/50"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 italic ml-1">
                    Customer paid ₱
                    {selectedReturn?.orders?.total_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Seller Evaluation Notes
                  </Label>
                  <Input
                    placeholder="Enter assessment notes..."
                    value={sellerNotes}
                    onChange={(e) =>
                      setSellerNotes(
                        e.target.value,
                      )
                    }
                    className="rounded-2xl border-slate-100 h-14 font-bold focus-visible:ring-amber-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setSelectedReturn(null)
                  }
                  className="rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-900"
                >
                  Cancel Review
                </Button>
                <Button
                  onClick={() =>
                    handleRefundPoints(
                      Number(refundAmount),
                    )
                  }
                  className="flex-1 bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-14 shadow-xl transition-all active:scale-[0.98]"
                >
                  Approve Assessment & Transfer
                  Points
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <XCircle className="h-7 w-7" />
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
