"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Camera,
  Video,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  useRouter,
  useParams,
} from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { submitCancellationRequest } from "@/app/actions/cancellations";
import { toast } from "sonner";

const CANCEL_REASONS = [
  "I want to change the delivery address",
  "I want to change the payment method",
  "I want to change the product selection",
  "Found a cheaper price elsewhere",
  "Ordered by mistake",
  "I changed my mind",
  "Shipping fee is too high",
  "Delivery time is too long",
  "Other reasons",
];

export default function CancellationPage() {
  const params = useParams();
  const id = params.id as string;
  const { purchases, refreshPurchases } =
    useUser();
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isSuccess, setIsSuccess] =
    useState<any>(null);

  const order = purchases.find(
    (p) => p.id === id,
  );

  if (!order && !isSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
        <div className="h-20 w-20 bg-slate-50 rounded-lg flex items-center justify-center text-slate-200 mx-auto mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">
          Order Not Found
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">
          The requested transaction ID is invalid or inaccessible
        </p>
        <Button
          onClick={() =>
            router.push(
              "/core/transaction1/purchases",
            )
          }
          className="bg-slate-900 text-white font-black h-12 px-8 rounded-lg uppercase text-[10px] tracking-widest hover:bg-black transition-all"
        >
          Back to My Purchases
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const result =
        await submitCancellationRequest({
          orderId: id,
          reason,
          details,
        });

      if (result.success) {
        toast.success(
          result.data?.isInstant
            ? "Order cancelled successfully"
            : "Cancellation request submitted",
        );
        refreshPurchases();
        setIsSuccess(result.data);
      } else {
        toast.error(
          result.error ||
            "Failed to submit cancellation",
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="max-w-md w-full border border-slate-200 shadow-none rounded-2xl overflow-hidden bg-white">
          <div className="p-8 md:p-12 text-center space-y-8">
            <div
              className={cn(
                "h-24 w-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl transition-transform hover:scale-105 duration-300",
                isSuccess.isInstant
                  ? "bg-slate-900 text-white shadow-slate-200"
                  : "bg-primary text-black shadow-primary/20",
              )}
            >
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
                {isSuccess.isInstant
                  ? "Order Cancelled"
                  : "Request Sent"}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {isSuccess.isInstant
                  ? "TRANSACTION TERMINATED"
                  : "PENDING SELLER APPROVAL"}
              </p>
            </div>

            <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
              {isSuccess.isInstant
                ? `Your order ${id.slice(0, 8)} has been cancelled successfully.`
                : `Your request for order ${id.slice(0, 8)} has been received and is pending seller approval.`}
            </p>

            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-left space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                  {isSuccess.isInstant
                    ? "The refund will be processed back to your original payment method shortly. Please allow 3-5 business days for it to reflect."
                    : "Since this order is already 'To Receive', the seller must review and approve your cancellation request before it can be finalized."}
                </p>
              </div>
            </div>

            <Button
              className="w-full bg-slate-900 text-white font-black h-14 rounded-xl uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
              onClick={() =>
                router.push(
                  "/core/transaction1/purchases",
                )
              }
            >
              Go to My Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
        <Link
          href="/core/transaction1/purchases"
          className="hover:text-primary transition-colors"
        >
          PURCHASES
        </Link>
        <ChevronRight className="h-2.5 w-2.5" />
        <span className="text-slate-900">
          CANCEL ORDER
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Cancel Order
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            Transaction ID:{" "}
            <span className="text-slate-900">
              {id}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <AlertCircle className="h-4 w-4" />
                Select Cancellation Reason
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CANCEL_REASONS.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReason(r)}
                    className={cn(
                      "text-left p-5 rounded-xl border transition-all text-[11px] font-black uppercase tracking-tight leading-none group",
                      reason === r
                        ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-200"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/30 text-slate-500",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{r}</span>
                      {reason === r && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details (Optional) */}
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <Info className="h-4 w-4" />
                Contextual Data (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  Detailed Justification
                </Label>
                <Textarea
                  value={details}
                  onChange={(e) =>
                    setDetails(e.target.value)
                  }
                  placeholder="PROVIDE ADDITIONAL CONTEXT FOR THE SELLER..."
                  className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50/30 focus:ring-0 font-bold text-[11px] uppercase tracking-widest p-4 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/10 p-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <CheckCircle2 className="h-4 w-4" />
                Submit Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-amber-900 leading-normal uppercase">
                    Warning: Once submitted, this action is
                    irreversible. Cancellation requests
                    are final.
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!reason || isSubmitting}
                  className="w-full h-14 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all border-none shadow-2xl shadow-slate-200"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Deploy Cancellation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
