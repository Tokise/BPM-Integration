"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  CreditCard,
  Send,
  ArrowUpRight,
  Banknote,
  History,
  Store,
  CheckCircle2,
  Filter,
  Search,
  Wallet,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approvePayrollBudget,
  sendPayrollOTP,
} from "@/app/actions/hr_finance_actions";

interface SellerSummary {
  shopId: string;
  shopName: string;
  count: number;
  totalAmount: number;
  action: string;
  date: string;
}

export default function FinanceDashboard() {
  const { profile, loading: userLoading } =
    useUser();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingDisbursement: 0,
    totalDisbursed: 0,
    platformRevenue: 0,
  });
  const [recentSellers, setRecentSellers] =
    useState<SellerSummary[]>([]);
  const [pendingPayroll, setPendingPayroll] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOtpModal, setShowOtpModal] =
    useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [activePayrollId, setActivePayrollId] =
    useState<string | null>(null);
  const [activeAmount, setActiveAmount] =
    useState<number>(0);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const { data: payouts } = await supabase
      .from("payout_management")
      .select(
        "amount, status, gross_amount, commission_fee, payment_processing_fee, withholding_tax, shops:shop_id(name), processed_at, approved_at",
      );

    if (payouts) {
      // ... same logic for totalSales, pendingDisbursement, etc.
      // (Simplified here for context, but keep existing logic in actual file)
      const totalSales = payouts
        .filter(
          (p) =>
            p.status === "approved" ||
            p.status === "completed",
        )
        .reduce(
          (acc, p) =>
            acc +
            Number(p.gross_amount || p.amount),
          0,
        );
      const pendingDisbursement = payouts
        .filter((p) => p.status === "approved")
        .reduce(
          (acc, p) => acc + Number(p.amount),
          0,
        );
      const totalDisbursed = payouts
        .filter((p) => p.status === "completed")
        .reduce(
          (acc, p) => acc + Number(p.amount),
          0,
        );
      const platformRevenue = payouts
        .filter((p) => p.status === "completed")
        .reduce(
          (acc, p) =>
            acc +
            Number(p.commission_fee || 0) +
            Number(
              p.payment_processing_fee || 0,
            ) +
            Number(p.withholding_tax || 0),
          0,
        );

      setStats({
        totalSales,
        pendingDisbursement,
        totalDisbursed,
        platformRevenue,
      });

      // Group recent transactions by seller
      const sellerMap: Record<
        string,
        SellerSummary
      > = {};
      const recentPayouts = payouts
        .filter(
          (p) =>
            p.status === "completed" ||
            p.status === "approved",
        )
        .sort(
          (a: any, b: any) =>
            new Date(
              b.processed_at ||
                b.approved_at ||
                0,
            ).getTime() -
            new Date(
              a.processed_at ||
                a.approved_at ||
                0,
            ).getTime(),
        );

      recentPayouts.forEach((p: any) => {
        const shopName =
          p.shops?.name || "Unknown";
        const key = `${shopName}-${p.status}`;
        if (!sellerMap[key]) {
          sellerMap[key] = {
            shopId: key,
            shopName,
            count: 0,
            totalAmount: 0,
            action:
              p.status === "completed"
                ? "Disbursed"
                : "Approved",
            date:
              p.processed_at ||
              p.approved_at ||
              new Date().toISOString(),
          };
        }
        sellerMap[key].count++;
        sellerMap[key].totalAmount += Number(
          p.amount,
        );
      });
      setRecentSellers(
        Object.values(sellerMap).slice(0, 10),
      );

      // Fetch pending payroll for approval
      const { data: payroll } = await supabase
        .schema("bpm-anec-global")
        .from("payroll_management")
        .select("*, profiles(full_name)")
        .eq("status", "budget_requested");
      setPendingPayroll(payroll || []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const ch1 = supabase
      .channel("finance-payouts-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payout_management",
        },
        () => fetchStats(),
      )
      .subscribe();
    const ch2 = supabase
      .channel("finance-payroll-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payroll_management",
        },
        () => fetchStats(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [supabase, fetchStats]);

  if (
    userLoading ||
    (loading && stats.totalSales === 0)
  ) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const isFinanceRole =
    profile?.role?.includes("finance") ||
    profile?.role === "admin";

  if (!isFinanceRole) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center px-4">
        <div className="h-20 w-20 rounded-[32px] bg-red-50 flex items-center justify-center mb-6 shadow-sm border border-red-100">
          <History className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Access Denied
        </h2>
        <p className="text-slate-500 mt-3 max-w-md font-medium">
          Your account is not authorized to access
          the Financial Ledger. Please contact
          your administrator if you believe this
          is an error.
        </p>
        <Button
          asChild
          className="mt-10 rounded-[20px] bg-slate-900 hover:bg-slate-800 h-12 px-8 shadow-lg shadow-slate-200"
        >
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleOpenApprove = async (
    id: string,
    amount: number,
  ) => {
    if (!profile?.email) {
      toast.error("User email not found for OTP");
      return;
    }

    const toastId = toast.loading(
      "Sending security code to your email...",
    );
    const res = await sendPayrollOTP(
      profile.id,
      profile.email,
    );

    if (res.success) {
      toast.success("Security code sent!", {
        id: toastId,
      });
      setActivePayrollId(id);
      setActiveAmount(amount);
      setShowOtpModal(true);
    } else {
      toast.error(
        res.error || "Failed to send OTP",
        { id: toastId },
      );
    }
  };

  const handleConfirmApprove = async () => {
    if (!activePayrollId || !profile?.id) return;
    toast.promise(
      approvePayrollBudget(
        activePayrollId,
        otpValue,
        profile.id,
      ),
      {
        loading:
          "Verifying OTP and approving budget...",
        success: "Budget approved and released",
        error: (e) =>
          e.message || "Approval failed",
      },
    );
    setShowOtpModal(false);
    setOtpValue("");
    fetchStats();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Financial Ledger
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Central Treasury & Payouts • Admin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search transactions..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-slate-900 font-medium text-xs shadow-none"
            />
          </div>
          <div />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Gross Sales",
            value: fmt(stats.totalSales),
            color: "amber",
            icon: ArrowUpRight,
          },
          {
            label: "Awaiting Disbursement",
            value: fmt(stats.pendingDisbursement),
            color: "blue",
            icon: History,
          },
          {
            label: "Total Disbursed",
            value: fmt(stats.totalDisbursed),
            color: "emerald",
            icon: CheckCircle2,
          },
          {
            label: "Platform Revenue",
            value: fmt(stats.platformRevenue),
            color: "purple",
            icon: Wallet,
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="border border-slate-200 shadow-none rounded-lg overflow-hidden group bg-white relative"
          >
            <CardContent className="p-6">
              <div
                className={`h-10 w-10 rounded-lg bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-4 border border-${s.color}-100`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                {s.label}
              </p>
              <h3 className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">
                {loading ? (
                  <span className="animate-pulse text-slate-100">
                    ...
                  </span>
                ) : (
                  <PrivacyMask value={s.value} />
                )}
              </h3>
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                  +12.5% trend
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions — grouped by seller */}
      <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">
                Recent Transactions
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Last 10 disbursements by merchant
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
              <History className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px]">
              Loading...
            </div>
          ) : recentSellers.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="h-12 w-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold italic">
                No recent transactions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Seller
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Orders
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Amount
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSellers.map((s) => (
                    <tr
                      key={s.shopId}
                      className="group hover:bg-slate-50/80 transition-all cursor-default"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center border ${s.action === "Disbursed" ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"}`}
                          >
                            <Store
                              className={`h-4 w-4 ${s.action === "Disbursed" ? "text-emerald-500" : "text-blue-500"}`}
                            />
                          </div>
                          <span className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            <PrivacyMask
                              value={s.shopName}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                          {s.count} order
                          {s.count > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="p-5 font-black text-emerald-600 text-sm">
                        {fmt(s.totalAmount)}
                      </td>
                      <td className="p-5">
                        <span
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${s.action === "Disbursed" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                        >
                          {s.action}
                        </span>
                      </td>
                      <td className="p-5 text-right text-[10px] font-bold text-slate-400">
                        {new Date(
                          s.date,
                        ).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Approvals */}
      {pendingPayroll.length > 0 && (
        <Card className="border border-indigo-100 shadow-none rounded-lg overflow-hidden bg-indigo-50/30">
          <CardContent className="p-0">
            <div className="p-8 border-b border-indigo-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-indigo-900 tracking-tighter uppercase">
                  Payroll Approvals
                </h2>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                  Salary batches awaiting treasury
                  authorization
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50/50">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      Employee
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      Net Pay
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      Period
                    </th>
                    <th className="p-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50">
                  {pendingPayroll.map((p) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-white transition-all"
                    >
                      <td className="p-5">
                        <span className="font-black text-indigo-900 text-sm">
                          <PrivacyMask
                            value={
                              p.profiles
                                ?.full_name ||
                              "Unknown"
                            }
                          />
                        </span>
                      </td>
                      <td className="p-5 font-black text-indigo-900 text-sm">
                        {fmt(p.net_pay)}
                      </td>
                      <td className="p-5 text-indigo-600 font-bold text-[10px] uppercase">
                        {p.pay_period_end}
                      </td>
                      <td className="p-5 text-right">
                        <Button
                          onClick={() =>
                            handleOpenApprove(
                              p.id,
                              p.net_pay,
                            )
                          }
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest h-8 px-4 rounded-lg shadow-none"
                        >
                          Approve
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OTP Verification Modal */}
      <Dialog
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
      >
        <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl bg-white overflow-hidden">
          <div className="relative text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner mb-2 ring-8 ring-indigo-50/50">
              <ShieldCheck className="h-10 w-10 animate-bounce-subtle" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Treasury Authorization
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                A security code has been sent to
                <br />
                <span className="text-indigo-600 font-black">
                  {profile?.email}
                </span>
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="relative group">
                <Input
                  placeholder="ENTER 6-CHAR CODE"
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(
                      e.target.value.toUpperCase(),
                    )
                  }
                  className="h-16 text-center text-2xl font-black tracking-[0.5em] bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all uppercase placeholder:tracking-normal placeholder:text-xs placeholder:font-black placeholder:text-slate-300"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleConfirmApprove}
                disabled={otpValue.length !== 6}
                className="w-full h-16 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                Authorize Budget ₱
                {activeAmount.toLocaleString()}
              </Button>

              <div className="pt-2">
                <button
                  onClick={() =>
                    handleOpenApprove(
                      activePayrollId!,
                      activeAmount,
                    )
                  }
                  className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                >
                  Didn't receive code? Resend Code
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
