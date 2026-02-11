
"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Camera,
    Video,
    AlertCircle,
    CheckCircle2,
    Info,
    Plus
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CANCEL_REASONS = [
    "I want to change the delivery address",
    "I want to change the payment method",
    "I want to change the product selection",
    "Found a cheaper price elsewhere",
    "Ordered by mistake",
    "I changed my mind",
    "Shipping fee is too high",
    "Delivery time is too long",
    "Other reasons"
];

export default function CancellationPage() {
    const params = useParams();
    const id = params.id as string;
    const { purchases, updatePurchaseStatus } = useUser();
    const router = useRouter();

    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [videos, setVideos] = useState<File[]>([]);

    const order = purchases.find(p => p.id === id);

    if (!order && !isSuccess) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-black mb-4">Order Not Found</h1>
                <p className="text-slate-500 mb-8">We couldn't find the order you're looking for.</p>
                <Button onClick={() => router.push('/profile?tab=purchases')} className="bg-primary text-black font-bold h-12 px-8 rounded-xl">
                    Back to My Purchases
                </Button>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!reason) return;

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        updatePurchaseStatus(id, 'cancelled');
        setIsSubmitting(false);
        setIsSuccess(true);
    };

    if (isSuccess) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
                <div className="bg-green-100 p-6 rounded-full text-green-600">
                    <CheckCircle2 className="h-16 w-16" />
                </div>
                <h1 className="text-4xl font-black text-slate-900">Cancellation Request Submitted</h1>
                <p className="text-slate-600 max-w-md">
                    Your request for order <span className="font-bold">{id}</span> has been received.
                    <br /><br />
                    <span className="text-xs italic bg-blue-50 text-blue-600 p-4 rounded-xl border border-blue-100 block">
                        Note: Refund processing depends on the seller's approval and payment method. Our team will review your proof and reason shortly.
                    </span>
                </p>
                <Button size="lg" className="bg-primary text-black font-bold h-14 px-10 rounded-2xl" onClick={() => router.push('/profile?tab=purchases')}>
                    Go to My Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Link href="/profile?tab=purchases" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders
            </Link>

            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-black">Cancel Order</h1>
                <p className="text-slate-500 font-medium">Order ID: <span className="text-slate-900">{id}</span></p>
            </div>

            <div className="space-y-6">
                {/* Cancellation Reason */}
                <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
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
                                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Details */}
                <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-black">Additional Details (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Textarea
                            placeholder="Please provide more information about your cancellation..."
                            className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 focus:ring-primary"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Media Proof */}
                <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            Upload Proof (Picture/Video)
                        </CardTitle>
                        <p className="text-xs text-slate-400 font-medium mt-1">Proof helps expedite the refund process. Especially for "Ordered by Mistake" or "Found Cheaper Price".</p>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase">Add Photo</span>
                            </div>
                            <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <Video className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase">Add Video</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Refund Policy Information</p>
                                <p className="text-[11px] text-orange-700 leading-relaxed">
                                    Full refund is subject to seller approval. If already processed, shipping fees might be deducted. Proof of cancellation might be shared with the seller.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4 pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason || isSubmitting}
                        className="w-full h-14 bg-primary text-black font-black text-lg rounded-2xl hover:bg-primary/90 transition-all border-none shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Cancellation"}
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                        Once submitted, this action cannot be undone
                    </p>
                </div>
            </div>
        </div>
    );
}
