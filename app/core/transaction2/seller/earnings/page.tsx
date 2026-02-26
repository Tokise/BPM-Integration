"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Landmark,
  Calendar,
  Download,
  Receipt,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Separator } from "@/components/ui/separator";

export default function EarningsDashboardPage() {
  const supabase = createClient();
  const [payouts, setPayouts] = useState<any[]>(
    [],
  );
  const [stats, setStats] = useState({
    totalGross: 0,
    totalNet: 0,
    totalCommission: 0,
    totalPaymentFee: 0,
    totalTax: 0,
    pendingBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: shop } = await supabase
      .schema("bpm-anec-global")
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (shop) {
      const { data: payoutData } = await supabase
        .schema("bpm-anec-global")
        .from("payout_management")
        .select("*, orders(order_number)")
        .eq("shop_id", shop.id)
        .order("processed_at", {
          ascending: false,
        });

      const list = payoutData || [];
      setPayouts(list);

      const totalGross = list.reduce(
        (a, p) => a + Number(p.gross_amount || 0),
        0,
      );
      const totalNet = list
        .filter((p) => p.status === "processed")
        .reduce(
          (a, p) => a + Number(p.amount || 0),
          0,
        );
      const totalCommission = list.reduce(
        (a, p) =>
          a + Number(p.commission_fee || 0),
        0,
      );
      const totalPaymentFee = list.reduce(
        (a, p) =>
          a +
          Number(p.payment_processing_fee || 0),
        0,
      );
      const totalTax = list.reduce(
        (a, p) =>
          a + Number(p.withholding_tax || 0),
        0,
      );
      const pendingBalance = list
        .filter((p) => p.status === "pending")
        .reduce(
          (a, p) => a + Number(p.amount || 0),
          0,
        );

      setStats({
        totalGross,
        totalNet,
        totalCommission,
        totalPaymentFee,
        totalTax,
        pendingBalance,
      });
    }
    setLoading(false);
  };

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Earnings Dashboard
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            COD payout reports and fee breakdown
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-slate-900 text-white overflow-hidden">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Pending Balance
          </p>
          <p className="text-4xl font-black mt-2">
            {fmt(stats.pendingBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-bold">
            Awaiting admin disbursement
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Total Received
          </p>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {fmt(stats.totalNet)}
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Total Deductions
          </p>
          <p className="text-3xl font-black text-rose-500 mt-2">
            {fmt(
              stats.totalCommission +
                stats.totalPaymentFee +
                stats.totalTax,
            )}
          </p>
          <div className="mt-3 space-y-1 text-[10px] font-bold text-slate-500">
            <div className="flex justify-between">
              <span>Commission</span>
              <span>
                {fmt(stats.totalCommission)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Fee</span>
              <span>
                {fmt(stats.totalPaymentFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Withholding Tax</span>
              <span>{fmt(stats.totalTax)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Payout History */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Order
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Gross
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Deductions
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Net
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payouts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-16 text-center"
                    >
                      <Landmark className="h-10 w-10 text-slate-100 mb-3 mx-auto" />
                      <p className="text-slate-400 font-bold italic">
                        No payouts yet. Complete
                        orders to see earnings.
                      </p>
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5 font-black text-slate-900 text-xs">
                        #
                        {p.orders?.order_number ||
                          p.order_id
                            ?.slice(0, 8)
                            .toUpperCase() ||
                          "—"}
                      </td>
                      <td className="p-5 font-black text-slate-900 text-sm">
                        {fmt(
                          Number(
                            p.gross_amount || 0,
                          ),
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col text-[10px] text-slate-500 font-bold space-y-0.5">
                          <span>
                            Com:{" "}
                            {fmt(
                              Number(
                                p.commission_fee ||
                                  0,
                              ),
                            )}
                          </span>
                          <span>
                            Pay:{" "}
                            {fmt(
                              Number(
                                p.payment_processing_fee ||
                                  0,
                              ),
                            )}
                          </span>
                          <span>
                            Tax:{" "}
                            {fmt(
                              Number(
                                p.withholding_tax ||
                                  0,
                              ),
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 font-black text-emerald-600 text-sm">
                        {fmt(Number(p.amount))}
                      </td>
                      <td className="p-5 text-right">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                            p.status ===
                            "processed"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {p.status ===
                          "processed"
                            ? "Disbursed"
                            : "Pending"}
                        </span>
                        {p.reference_number && (
                          <p className="text-[9px] font-bold text-slate-400 mt-1">
                            Ref:{" "}
                            {p.reference_number}
                          </p>
                        )}
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
