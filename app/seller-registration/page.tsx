"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

export default function SellerRegistrationPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] =
    useState(false);

  const [formData, setFormData] = useState({
    shopName: "",
    shopDescription: "",
  });

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to apply");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      "Submitting your application...",
    );

    try {
      const { error } = await supabase
        .from("seller_applications")
        .insert({
          user_id: user.id,
          shop_name: formData.shopName,
          shop_description:
            formData.shopDescription,
          status: "pending",
        });

      if (error) throw error;

      toast.success(
        "Application submitted successfully!",
        { id: toastId },
      );
      setSubmitted(true);
    } catch (error: any) {
      console.error(
        "Error submitting application:",
        error,
      );
      toast.error(
        error.message ||
          "Failed to submit application",
        { id: toastId },
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-green-50 p-6 rounded-full mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">
          Application Received!
        </h1>
        <p className="text-slate-500 max-w-md mb-8">
          Your application to become a seller is
          now being reviewed by our Logistics
          Procurement team. We'll notify you once
          your application has been processed.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-primary text-black font-bold h-12 px-8 rounded-xl"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-12 text-center">
        <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
          <Store className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Become a Seller
        </h1>
        <p className="text-slate-500 font-medium">
          Start your business journey with ANEC
          Global. Fill out the form below to
          apply.
        </p>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-black">
            Shop Information
          </CardTitle>
          <CardDescription>
            Enter the details for your future
            storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label
                htmlFor="shopName"
                className="text-xs font-black uppercase tracking-wider text-slate-400 px-1"
              >
                Shop Name
              </Label>
              <Input
                id="shopName"
                placeholder="Ex. Juan's General Store"
                required
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900"
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopName: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="shopDescription"
                className="text-xs font-black uppercase tracking-wider text-slate-400 px-1"
              >
                Shop Description
              </Label>
              <Textarea
                id="shopDescription"
                placeholder="Tell us what you plan to sell..."
                required
                className="min-h-[150px] rounded-3xl bg-slate-50 border-none font-medium text-slate-900 p-4"
                value={formData.shopDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopDescription:
                      e.target.value,
                  })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-black h-14 rounded-2xl text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Submit Application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
        <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">
            Verification Process
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            All applications are manually verified
            by our procurement department.
            Validation typically takes 1-2
            business days.
          </p>
        </div>
      </div>
    </div>
  );
}
