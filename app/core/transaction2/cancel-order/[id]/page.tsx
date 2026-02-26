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
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-black mb-4">
          Order Not Found
        </h1>
        <p className="text-slate-500 mb-8">
          We couldn't find the order you're
          looking for.
        </p>
        <Button
          onClick={() =>
            router.push(
              "/core/transaction1/purchases",
            )
          }
          className="bg-primary text-black font-bold h-12 px-8 rounded-xl"
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
      <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
        <div
          className={cn(
            "p-6 rounded-full",
            isSuccess.isInstant
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600",
          )}
        >
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-black text-slate-900">
          {isSuccess.isInstant
            ? "Order Cancelled"
            : "Cancellation Request Submitted"}
        </h1>
        <p className="text-slate-600 max-w-md">
          {isSuccess.isInstant
            ? `Your order ${id} has been cancelled successfully.`
            : `Your request for order ${id} has been received and is pending seller approval.`}
          <br />
          <br />
          <span className="text-xs italic bg-blue-50 text-blue-600 p-4 rounded-xl border border-blue-100 block">
            {isSuccess.isInstant
              ? "The refund will be processed back to your original payment method shortly."
              : "Note: Since this order is already 'To Receive', the seller needs to approve the cancellation before it can be processed."}
          </span>
        </p>
        <Button
          size="lg"
          className="bg-primary text-black font-bold h-14 px-10 rounded-2xl"
          onClick={() =>
            router.push(
              "/core/transaction1/purchases",
            )
          }
        >
          Go to My Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/core/transaction1/purchases"
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />{" "}
        Back to My Orders
      </Link>

      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-black">
          Cancel Order
        </h1>
        <p className="text-slate-500 font-medium">
          Order ID:{" "}
          <span className="text-slate-900">
            {id}
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Cancellation Reason */}
        <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-black flex items-center gap-2 mt-6">
              <Info className="h-5 w-5 text-primary" />
              Select Cancellation Reason
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CANCEL_REASONS.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => setReason(r)}
                  className={cn(
                    "text-left p-4 rounded-2xl border-2 transition-all text-sm font-bold",
                    reason === r
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-100 hover:border-slate-200 text-slate-600",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="w-full h-14 bg-primary text-black font-black text-lg rounded-2xl hover:bg-primary/90 transition-all border-none shadow-lg shadow-primary/20"
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit Cancellation"}
          </Button>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
            Once submitted, this action cannot be
            undone
          </p>
        </div>
      </div>
    </div>
  );
}
