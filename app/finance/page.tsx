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
  const [loading, setLoading] = useState(true);

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
    return () => {
      supabase.removeChannel(ch1);
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Financial Ledger
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
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
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-black rounded-lg h-10 px-6 hover:bg-slate-50 uppercase tracking-widest text-[10px] shadow-none"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px]">
            Generate Report
          </Button>
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
    </div>
  );
}
