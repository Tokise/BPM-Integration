"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOTPAction, generateAndSendOTP } from "@/app/actions/auth_otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight, Loader2, Mail } from "lucide-react";

export default function VerifyOTP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("uid");
  const email = searchParams.get("email");
  const next = searchParams.get("next") || "/";

  const [otp, setOtp] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!userId || !email) {
      toast.error("Missing session information. Please sign in again.");
      router.push("/auth/sign-in");
    }
  }, [userId, email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      return toast.error("Please enter a valid 6-character code.");
    }

    startTransition(async () => {
      const result = await verifyOTPAction(userId!, otp);
      if (result.success) {
        toast.success("Identity verified successfully!");
        router.push(next);
      } else {
        toast.error(result.error || "Invalid code.");
      }
    });
  };

  const handleResend = async () => {
    if (!userId || !email) return;
    setIsResending(true);
    const result = await generateAndSendOTP(userId, email);
    setIsResending(false);
    
    if (result.success) {
      toast.success("A new code has been sent to your email.");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                Verify Identity
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Mail className="h-3 w-3" /> Sent to {email ? email.replace(/(.{3})(.*)(?=@)/, '$1***') : "your email"}
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Enter 6-Character Code
              </label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                placeholder="X 1 Y 2 Z 3"
                className="h-16 text-center text-2xl font-black tracking-[0.5em] rounded-2xl border-2 border-slate-100 bg-slate-50 focus-visible:ring-blue-600 focus-visible:border-transparent transition-all"
                maxLength={6}
                disabled={isPending}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || otp.length < 6}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200 group transition-all"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify & Access Dashboard
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={isResending || isPending}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Didn't receive a code? Resend"}
            </button>
          </div>
        </div>

        <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Multi-factor authentication is required to protect <br />
            your HR and Payroll records.
          </p>
        </div>
      </div>
    </div>
  );
}
