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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

interface SellerSummary {
  shopId: string;
  shopName: string;
  count: number;
  totalAmount: number;
  action: string;
  date: string;
}

export default function FinanceDashboard() {
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

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Finance Dashboard
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Financial overview — real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Gross Sales",
            value: fmt(stats.totalSales),
            color: "amber",
          },
          {
            label: "Awaiting Disbursement",
            value: fmt(stats.pendingDisbursement),
            color: "blue",
          },
          {
            label: "Total Disbursed",
            value: fmt(stats.totalDisbursed),
            color: "emerald",
          },
          {
            label: "Platform Revenue",
            value: fmt(stats.platformRevenue),
            color: "purple",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-6 bg-white relative overflow-hidden"
          >
            <div
              className={`absolute -top-8 -right-8 h-32 w-32 bg-${s.color}-50 rounded-full blur-3xl opacity-50`}
            />
            <div className="flex items-center justify-between mb-3">
              <div
                className={`h-10 w-10 bg-${s.color}-50 rounded-xl flex items-center justify-center`}
              >
                <span
                  className={`text-${s.color}-500 font-black text-lg`}
                >
                  ₱
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300" />
            </div>
            <p
              className={`text-[10px] font-black uppercase tracking-widest text-${s.color}-600 mb-1`}
            >
              {s.label}
            </p>
            <p className="text-2xl font-black text-slate-900">
              {loading ? "..." : s.value}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase">
                Live
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                Real-time
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Transactions — grouped by seller */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black tracking-tight">
            Recent Transactions
          </CardTitle>
          <History className="h-5 w-5 text-slate-300" />
        </CardHeader>
        <CardContent className="p-0">
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
                  <tr className="bg-slate-50/50">
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
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.action === "Disbursed" ? "bg-emerald-50" : "bg-blue-50"}`}
                          >
                            <Store
                              className={`h-4 w-4 ${s.action === "Disbursed" ? "text-emerald-500" : "text-blue-500"}`}
                            />
                          </div>
                          <span className="font-black text-slate-900 text-sm">
                            {s.shopName}
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
