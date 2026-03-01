"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Store,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface PayoutEntry {
  id: string;
  amount: number;
  gross_amount: number;
  commission_fee: number;
  payment_processing_fee: number;
  withholding_tax: number;
  status: string;
  processed_at: string | null;
  shops: { name: string } | null;
}

export default function LedgerPage() {
  const supabase = createClient();
  const [payouts, setPayouts] = useState<
    PayoutEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchLedgerData =
    useCallback(async () => {
      setLoading(true);

      const { data } = await supabase
        .from("payout_management")
        .select(
          "id, amount, gross_amount, commission_fee, payment_processing_fee, withholding_tax, status, processed_at, shops:shop_id(name)",
        )
        .in("status", ["approved", "completed"])
        .order("processed_at", {
          ascending: false,
        });

      setPayouts(
        (data || []) as unknown as PayoutEntry[],
      );
      setLoading(false);
    }, [supabase]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  useEffect(() => {
    const ch = supabase
      .channel("ledger-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payout_management",
        },
        () => fetchLedgerData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, fetchLedgerData]);

  // === Key metrics ===
  // Gross sales = total of all gross_amount
  const grossSales = useMemo(
    () =>
      payouts.reduce(
        (a, p) =>
          a + Number(p.gross_amount || p.amount),
        0,
      ),
    [payouts],
  );
  // Commission = total of all commission_fee (what platform earns)
  const totalCommission = useMemo(
    () =>
      payouts.reduce(
        (a, p) =>
          a + Number(p.commission_fee || 0),
        0,
      ),
    [payouts],
  );
  // Processing fees
  const totalProcessingFee = useMemo(
    () =>
      payouts.reduce(
        (a, p) =>
          a +
          Number(p.payment_processing_fee || 0),
        0,
      ),
    [payouts],
  );
  // Tax
  const totalTax = useMemo(
    () =>
      payouts.reduce(
        (a, p) =>
          a + Number(p.withholding_tax || 0),
        0,
      ),
    [payouts],
  );
  // Platform revenue = all fees collected (commission + processing + tax)
  const platformRevenue =
    totalCommission +
    totalProcessingFee +
    totalTax;
  // Seller payouts disbursed
  const sellerPayoutsDisbursed = useMemo(
    () =>
      payouts
        .filter((p) => p.status === "completed")
        .reduce(
          (a, p) => a + Number(p.amount),
          0,
        ),
    [payouts],
  );
  // Seller payouts pending
  const sellerPayoutsPending = useMemo(
    () =>
      payouts
        .filter((p) => p.status !== "completed")
        .reduce(
          (a, p) => a + Number(p.amount),
          0,
        ),
    [payouts],
  );

  const fmt = (n: number) =>
    `₱${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Monthly trend
  const monthlyData = useMemo(() => {
    const months: Record<
      string,
      { sales: number; commission: number }
    > = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      );
      months[
        d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        })
      ] = { sales: 0, commission: 0 };
    }
    payouts.forEach((p) => {
      if (p.processed_at) {
        const key = new Date(
          p.processed_at,
        ).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        });
        if (months[key]) {
          months[key].sales += Number(
            p.gross_amount || p.amount,
          );
          months[key].commission +=
            Number(p.commission_fee || 0) +
            Number(
              p.payment_processing_fee || 0,
            ) +
            Number(p.withholding_tax || 0);
        }
      }
    });
    return Object.entries(months).map(
      ([month, data]) => ({ month, ...data }),
    );
  }, [payouts]);

  const maxBar = Math.max(
    ...monthlyData.map((m) =>
      Math.max(m.sales, m.commission),
    ),
    1,
  );

  // Revenue breakdown for donut
  const breakdownData = useMemo(() => {
    const total = grossSales || 1;
    return [
      {
        label: "Platform Commission (5%)",
        value: totalCommission,
        pct: (totalCommission / total) * 100,
        color: "bg-amber-500",
      },
      {
        label: "Processing Fees (2.24%)",
        value: totalProcessingFee,
        pct: (totalProcessingFee / total) * 100,
        color: "bg-purple-500",
      },
      {
        label: "Withholding Tax (0.5%)",
        value: totalTax,
        pct: (totalTax / total) * 100,
        color: "bg-blue-500",
      },
      {
        label: "Seller Net Payout",
        value:
          sellerPayoutsDisbursed +
          sellerPayoutsPending,
        pct:
          ((sellerPayoutsDisbursed +
            sellerPayoutsPending) /
            total) *
          100,
        color: "bg-emerald-400",
      },
    ];
  }, [
    grossSales,
    totalCommission,
    totalProcessingFee,
    totalTax,
    sellerPayoutsDisbursed,
    sellerPayoutsPending,
  ]);

  // Ledger entries grouped by seller
  const sellerEntries = useMemo(() => {
    const map: Record<
      string,
      {
        shopName: string;
        gross: number;
        net: number;
        fees: number;
        count: number;
        status: string;
      }
    > = {};
    payouts.forEach((p) => {
      const name =
        (p.shops as any)?.name || "Unknown";
      if (!map[name])
        map[name] = {
          shopName: name,
          gross: 0,
          net: 0,
          fees: 0,
          count: 0,
          status: "",
        };
      map[name].gross += Number(
        p.gross_amount || p.amount,
      );
      map[name].net += Number(p.amount);
      map[name].fees +=
        Number(p.commission_fee || 0) +
        Number(p.payment_processing_fee || 0) +
        Number(p.withholding_tax || 0);
      map[name].count++;
      // Use latest status
      if (p.status === "completed")
        map[name].status = "completed";
      else if (!map[name].status)
        map[name].status = p.status;
    });
    return Object.values(map);
  }, [payouts]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          General Ledger
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Company financial statements — sales,
          revenue, expenses
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Gross Sales",
            value: fmt(grossSales),
            color: "amber",
            sub: "Total order value",
          },
          {
            label: "Platform Revenue",
            value: fmt(platformRevenue),
            color: "emerald",
            sub: "Commission + fees",
          },
          {
            label: "Seller Payouts",
            value: fmt(
              sellerPayoutsDisbursed +
                sellerPayoutsPending,
            ),
            color: "blue",
            sub: "Net to sellers",
          },
          {
            label: "Pending Payouts",
            value: fmt(sellerPayoutsPending),
            color: "orange",
            sub: "Not yet disbursed",
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
            <p className="text-[9px] font-bold text-slate-400 mt-1">
              {s.sub}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Overview */}
        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-300" />
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 font-bold uppercase text-[10px]">
                Loading...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-amber-500" />
                    <span className="text-slate-500">
                      Gross Sales
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-500">
                      Platform Revenue
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {monthlyData.map((m) => (
                    <div
                      key={m.month}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase w-16">
                          {m.month}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {fmt(m.sales)} /{" "}
                          {fmt(m.commission)}
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-5">
                        <div
                          className="bg-amber-500 rounded-lg transition-all"
                          style={{
                            width: `${(m.sales / maxBar) * 100}%`,
                            minWidth:
                              m.sales > 0
                                ? "8px"
                                : "0",
                          }}
                        />
                        <div
                          className="bg-emerald-500 rounded-lg transition-all"
                          style={{
                            width: `${(m.commission / maxBar) * 100}%`,
                            minWidth:
                              m.commission > 0
                                ? "8px"
                                : "0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-300" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 font-bold uppercase text-[10px]">
                Loading...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-8">
                  <div className="relative h-36 w-36 shrink-0">
                    <svg
                      viewBox="0 0 36 36"
                      className="h-full w-full -rotate-90"
                    >
                      {(() => {
                        let offset = 0;
                        const colors = [
                          "#f59e0b",
                          "#a855f7",
                          "#3b82f6",
                          "#34d399",
                        ];
                        return breakdownData.map(
                          (d, i) => {
                            const dash = Math.max(
                              d.pct * 0.01 * 100,
                              0,
                            );
                            const el = (
                              <circle
                                key={i}
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke={colors[i]}
                                strokeWidth="3.5"
                                strokeDasharray={`${dash} ${100 - dash}`}
                                strokeDashoffset={`${-offset}`}
                                strokeLinecap="round"
                              />
                            );
                            offset += dash;
                            return el;
                          },
                        );
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        Gross Sales
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {fmt(grossSales)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {breakdownData.map((d) => (
                      <div
                        key={d.label}
                        className="space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-700">
                            {d.label}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {fmt(d.value)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${d.color} rounded-full transition-all`}
                            style={{
                              width: `${Math.min(d.pct, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400">
                          {d.pct.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Statement */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-300" />
            Income Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Line Item
                </th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="bg-amber-50/30">
                <td className="p-5 font-black text-amber-700 text-sm">
                  Gross Sales Revenue
                </td>
                <td className="p-5 text-right font-black text-amber-700 text-sm">
                  {fmt(grossSales)}
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-600 text-sm pl-10">
                  Less: Seller Net Payouts
                  (Disbursed)
                </td>
                <td className="p-5 text-right font-bold text-red-500 text-sm">
                  ({fmt(sellerPayoutsDisbursed)})
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-600 text-sm pl-10">
                  Less: Seller Net Payouts
                  (Pending)
                </td>
                <td className="p-5 text-right font-bold text-orange-500 text-sm">
                  ({fmt(sellerPayoutsPending)})
                </td>
              </tr>
              <tr className="bg-emerald-50/30">
                <td className="p-5 font-black text-emerald-700 text-sm">
                  Platform Revenue (Commission +
                  Fees)
                </td>
                <td className="p-5 text-right font-black text-emerald-700 text-sm">
                  {fmt(platformRevenue)}
                </td>
              </tr>
              <tr className="border-t-2 border-slate-200">
                <td className="p-5 font-bold text-slate-500 text-sm pl-10">
                  Commission
                </td>
                <td className="p-5 text-right font-bold text-slate-600 text-sm">
                  {fmt(totalCommission)}
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-500 text-sm pl-10">
                  Processing Fees
                </td>
                <td className="p-5 text-right font-bold text-slate-600 text-sm">
                  {fmt(totalProcessingFee)}
                </td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-500 text-sm pl-10">
                  Withholding Tax
                </td>
                <td className="p-5 text-right font-bold text-slate-600 text-sm">
                  {fmt(totalTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Ledger Entries — grouped by seller */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-black tracking-tight">
            Ledger Entries by Seller
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                    Gross Sales
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Platform Fees
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Net to Seller
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse"
                    >
                      <td
                        colSpan={5}
                        className="p-8 bg-slate-50/20"
                      />
                    </tr>
                  ))
                ) : sellerEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center text-slate-400 font-bold italic"
                    >
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  sellerEntries.map((s) => (
                    <tr
                      key={s.shopName}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Store className="h-4 w-4 text-slate-500" />
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
                      <td className="p-5 font-black text-amber-600 text-sm">
                        {fmt(s.gross)}
                      </td>
                      <td className="p-5 font-black text-emerald-600 text-sm">
                        {fmt(s.fees)}
                      </td>
                      <td className="p-5 text-right font-black text-blue-600 text-sm">
                        {fmt(s.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
