"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Landmark,
  Banknote,
  History,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Calculator,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function PayoutManagementPage() {
  const supabase = createClient();
  const [payouts, setPayouts] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] =
    useState<any>(null);
  const [refNumber, setRefNumber] = useState("");

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("payout_management")
      .select("*, orders(order_number)")
      .order("processed_at", {
        ascending: false,
      });

    if (error) {
      toast.error("Failed to fetch payouts");
    } else {
      setPayouts(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleProcessPayout = async () => {
    if (!selectedPayout || !refNumber) return;

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("payout_management")
      .update({
        status: "processed",
        reference_number: refNumber,
        processed_at: new Date().toISOString(),
      })
      .eq("id", selectedPayout.id);

    if (error) {
      toast.error("Failed to process payout");
    } else {
      toast.success("Payout marked as processed");
      setSelectedPayout(null);
      setRefNumber("");
      fetchPayouts();
    }
  };

  const pendingCount = payouts.filter(
    (p) => p.status === "pending",
  ).length;
  const pendingAmount = payouts
    .filter((p) => p.status === "pending")
    .reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );

  const settledAmount = payouts
    .filter((p) => p.status === "processed")
    .reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Payout Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            COD disbursements with fee breakdown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-orange-100">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest">
              {pendingCount} Pending
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white p-8 space-y-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -top-12 -right-12 h-48 w-48 bg-slate-50 rounded-full blur-3xl opacity-50" />
          <div>
            <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-slate-200">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Financial Overview
            </h3>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Pending Disbursement
              </p>
              <p className="text-3xl font-black text-slate-900">
                {fmt(pendingAmount)}
              </p>
            </div>
            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                Total Settled
              </p>
              <p className="text-3xl font-black text-emerald-700">
                {fmt(settledAmount)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black tracking-tight">
              Payout Records
            </CardTitle>
            <History className="h-5 w-5 text-slate-300" />
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
                      Fees
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Net
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Action
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
                          className="p-10 bg-slate-50/20"
                        />
                      </tr>
                    ))
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-20 text-center"
                      >
                        <Banknote className="h-12 w-12 text-slate-100 mb-4 mx-auto" />
                        <p className="text-slate-400 font-bold italic">
                          No payout records.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">
                              #
                              {p.orders
                                ?.order_number ||
                                p.shop_id
                                  .slice(0, 8)
                                  .toUpperCase()}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 w-fit ${
                                p.status ===
                                "processed"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 font-black text-slate-900 text-sm">
                          {fmt(
                            Number(
                              p.gross_amount ||
                                p.amount,
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
                          {p.status ===
                          "pending" ? (
                            <Button
                              onClick={() =>
                                setSelectedPayout(
                                  p,
                                )
                              }
                              className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase rounded-lg h-8 gap-2"
                            >
                              Process{" "}
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />{" "}
                                {p.reference_number ||
                                  "NO REF"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                {p.processed_at
                                  ? new Date(
                                      p.processed_at,
                                    ).toLocaleDateString(
                                      undefined,
                                      {
                                        month:
                                          "short",
                                        day: "numeric",
                                        year: "numeric",
                                      },
                                    )
                                  : "N/A"}
                              </span>
                            </div>
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

      <Dialog
        open={!!selectedPayout}
        onOpenChange={(open) =>
          !open && setSelectedPayout(null)
        }
      >
        <DialogContent className="sm:max-w-[480px] rounded-[40px] border-none shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-500" />
              Finalize Payout
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Review the fee breakdown and enter
              the bank reference number.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 p-6 rounded-3xl my-4 border border-slate-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-500">
                Gross Sale
              </span>
              <span className="font-black text-slate-900">
                {fmt(
                  Number(
                    selectedPayout?.gross_amount ||
                      0,
                  ),
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-500">
                Commission (3%)
              </span>
              <span className="font-bold text-rose-500">
                -
                {fmt(
                  Number(
                    selectedPayout?.commission_fee ||
                      0,
                  ),
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-500">
                Payment Fee (2.24%)
              </span>
              <span className="font-bold text-rose-500">
                -
                {fmt(
                  Number(
                    selectedPayout?.payment_processing_fee ||
                      0,
                  ),
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-500">
                Withholding Tax (0.5%)
              </span>
              <span className="font-bold text-rose-500">
                -
                {fmt(
                  Number(
                    selectedPayout?.withholding_tax ||
                      0,
                  ),
                )}
              </span>
            </div>
            <Separator className="bg-slate-200" />
            <div className="flex justify-between">
              <span className="font-black text-slate-900 text-lg">
                Net to Seller
              </span>
              <span className="font-black text-emerald-600 text-lg">
                {fmt(
                  Number(
                    selectedPayout?.amount || 0,
                  ),
                )}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Reference Number / Transaction ID
            </Label>
            <Input
              placeholder="BANK-12345678"
              value={refNumber}
              onChange={(e) =>
                setRefNumber(e.target.value)
              }
              className="rounded-2xl border-slate-100 h-14 font-black focus-visible:ring-slate-900"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              onClick={handleProcessPayout}
              className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-14 shadow-xl shadow-slate-200 text-lg"
            >
              Verify & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
