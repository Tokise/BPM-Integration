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
  CheckCircle2,
  ChevronRight,
  Receipt,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/context/UserContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface PayoutRecord {
  id: string;
  shop_id: string;
  order_id: string;
  amount: number;
  gross_amount: number;
  commission_fee: number;
  payment_processing_fee: number;
  withholding_tax: number;
  shipping_subsidy: number;
  status: string;
  processed_at: string | null;
  reference_number: string | null;
  approved_by: string | null;
  approved_at: string | null;
  disbursed_by: string | null;
  orders: { order_number: string } | null;
  shops: { name: string } | null;
}

interface SellerGroup {
  shopId: string;
  shopName: string;
  ownerName: string;
  pendingCount: number;
  totalPendingAmount: number;
  totalGrossAmount: number;
  payouts: PayoutRecord[];
}

export default function PayoutManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const [payouts, setPayouts] = useState<
    PayoutRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sellerGroups, setSellerGroups] =
    useState<SellerGroup[]>([]);
  const [selectedSeller, setSelectedSeller] =
    useState<SellerGroup | null>(null);
  const [approving, setApproving] =
    useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payout_management")
      .select(
        "*, orders(order_number), shops:shop_id(name)",
      )
      .order("processed_at", {
        ascending: false,
      });

    if (error) {
      toast.error("Failed to fetch payouts");
      setLoading(false);
      return;
    }

    const records = (data ||
      []) as PayoutRecord[];
    setPayouts(records);

    const shopIds = [
      ...new Set(records.map((p) => p.shop_id)),
    ];
    if (shopIds.length > 0) {
      const { data: shops } = await supabase
        .from("shops")
        .select(
          "id, name, owner:profiles(full_name)",
        )
        .in("id", shopIds);

      const shopMap: Record<
        string,
        { name: string; ownerName: string }
      > = {};
      (shops || []).forEach((s: any) => {
        shopMap[s.id] = {
          name: s.name || "Unknown Shop",
          ownerName:
            s.owner?.full_name || "Unknown",
        };
      });

      const groups: Record<string, SellerGroup> =
        {};
      records
        .filter((p) => p.status === "pending")
        .forEach((p) => {
          if (!groups[p.shop_id]) {
            groups[p.shop_id] = {
              shopId: p.shop_id,
              shopName:
                shopMap[p.shop_id]?.name ||
                p.shop_id.slice(0, 8),
              ownerName:
                shopMap[p.shop_id]?.ownerName ||
                "Unknown",
              pendingCount: 0,
              totalPendingAmount: 0,
              totalGrossAmount: 0,
              payouts: [],
            };
          }
          groups[p.shop_id].pendingCount++;
          groups[p.shop_id].totalPendingAmount +=
            Number(p.amount);
          groups[p.shop_id].totalGrossAmount +=
            Number(p.gross_amount || p.amount);
          groups[p.shop_id].payouts.push(p);
        });

      setSellerGroups(Object.values(groups));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    const channel = supabase
      .channel("payout-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payout_management",
        },
        () => fetchPayouts(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchPayouts]);

  const handleApproveSeller = async (
    group: SellerGroup,
  ) => {
    if (!profile?.id) return;
    setApproving(true);
    try {
      const payoutIds = group.payouts.map(
        (p) => p.id,
      );
      const { error } = await supabase
        .from("payout_management")
        .update({
          status: "approved",
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        })
        .in("id", payoutIds);
      if (error) throw error;

      await supabase.from("audit_logs").insert(
        payoutIds.map((pid) => ({
          user_id: profile.id,
          action: "payout_approved",
          entity_type: "payout",
          entity_id: pid,
          details: {
            shop_id: group.shopId,
            shop_name: group.shopName,
            total_amount:
              group.totalPendingAmount,
          },
        })),
      );

      toast.success(
        `Approved ${group.pendingCount} payout(s) for ${group.shopName} — sent to Finance`,
      );
      setSelectedSeller(null);
      fetchPayouts();
    } catch {
      toast.error("Failed to approve payouts");
    } finally {
      setApproving(false);
    }
  };

  const pendingCount = payouts.filter(
    (p) => p.status === "pending",
  ).length;
  const approvedCount = payouts.filter(
    (p) => p.status === "approved",
  ).length;
  const completedCount = payouts.filter(
    (p) => p.status === "completed",
  ).length;
  const pendingAmount = payouts
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + Number(p.amount), 0);
  const approvedAmount = payouts
    .filter((p) => p.status === "approved")
    .reduce((a, p) => a + Number(p.amount), 0);
  const completedAmount = payouts
    .filter((p) => p.status === "completed")
    .reduce((a, p) => a + Number(p.amount), 0);

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/core/transaction3/admin">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Payout Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Payout Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
            Core 3: Financial Settlements & Review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-200 shadow-none">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest">
              {pendingCount} Pending
            </span>
          </div>
          {approvedCount > 0 && (
            <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                {approvedCount} With Finance
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Pending Approval",
            value: fmt(pendingAmount),
            sub: `${pendingCount} orders`,
            color: "orange",
            Icon: Landmark,
          },
          {
            label: "With Finance",
            value: fmt(approvedAmount),
            sub: `${approvedCount} orders`,
            color: "blue",
            Icon: Receipt,
          },
          {
            label: "Total Disbursed",
            value: fmt(completedAmount),
            sub: `${completedCount} orders`,
            color: "emerald",
            Icon: CheckCircle2,
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="border border-slate-200 shadow-none rounded-lg p-8 bg-white relative overflow-hidden"
          >
            {/* Background effect removed for clarity */}
            <div
              className={`h-12 w-12 bg-${s.color}-50 rounded-2xl flex items-center justify-center mb-4`}
            >
              <s.Icon
                className={`h-6 w-6 text-${s.color}-500`}
              />
            </div>
            <p
              className={`text-[10px] font-black text-${s.color}-600 uppercase tracking-widest mb-1`}
            >
              {s.label}
            </p>
            <p
              className={`text-3xl font-black text-${s.color}-700`}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              {s.sub}
            </p>
          </Card>
        ))}
      </div>

      {/* Sellers Awaiting Approval */}
      <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black tracking-tight">
            Sellers Awaiting Approval
          </CardTitle>
          <Store className="h-5 w-5 text-slate-300" />
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
                    Total Gross
                  </th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Net to Seller
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
                ) : sellerGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-20 text-center"
                    >
                      <Banknote className="h-12 w-12 text-slate-100 mb-4 mx-auto" />
                      <p className="text-slate-400 font-bold italic">
                        No pending payouts to
                        approve.
                      </p>
                    </td>
                  </tr>
                ) : (
                  sellerGroups.map((g) => (
                    <tr
                      key={g.shopId}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Store className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-sm block">
                              {g.shopName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {g.ownerName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                          {g.pendingCount} order
                          {g.pendingCount > 1
                            ? "s"
                            : ""}
                        </span>
                      </td>
                      <td className="p-5 font-black text-slate-900 text-sm">
                        {fmt(g.totalGrossAmount)}
                      </td>
                      <td className="p-5 font-black text-emerald-600 text-sm">
                        {fmt(
                          g.totalPendingAmount,
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <Button
                          onClick={() =>
                            setSelectedSeller(g)
                          }
                          className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase rounded-lg h-8 gap-2"
                        >
                          Review{" "}
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approved & Completed — grouped by seller */}
      {payouts.filter(
        (p) =>
          p.status === "approved" ||
          p.status === "completed",
      ).length > 0 &&
        (() => {
          const acGroups: Record<
            string,
            {
              shopName: string;
              approved: number;
              completed: number;
              approvedAmt: number;
              completedAmt: number;
            }
          > = {};
          payouts
            .filter(
              (p) =>
                p.status === "approved" ||
                p.status === "completed",
            )
            .forEach((p) => {
              const name =
                (p.shops as any)?.name ||
                p.shop_id.slice(0, 8);
              if (!acGroups[name])
                acGroups[name] = {
                  shopName: name,
                  approved: 0,
                  completed: 0,
                  approvedAmt: 0,
                  completedAmt: 0,
                };
              if (p.status === "approved") {
                acGroups[name].approved++;
                acGroups[name].approvedAmt +=
                  Number(p.amount);
              } else {
                acGroups[name].completed++;
                acGroups[name].completedAmt +=
                  Number(p.amount);
              }
            });
          return (
            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black tracking-tight">
                  Approved &amp; Completed
                </CardTitle>
                <History className="h-5 w-5 text-slate-300" />
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
                          Amount
                        </th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Object.values(
                        acGroups,
                      ).map((g) => (
                        <tr
                          key={g.shopName}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Store className="h-4 w-4 text-slate-500" />
                              </div>
                              <span className="font-black text-slate-900 text-sm">
                                {g.shopName}
                              </span>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                              {g.approved +
                                g.completed}{" "}
                              order
                              {g.approved +
                                g.completed >
                              1
                                ? "s"
                                : ""}
                            </span>
                          </td>
                          <td className="p-5 font-black text-emerald-600 text-sm">
                            {fmt(
                              g.approvedAmt +
                                g.completedAmt,
                            )}
                          </td>
                          <td className="p-5 text-right space-x-1">
                            {g.approved > 0 && (
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                                With Finance (
                                {g.approved})
                              </span>
                            )}
                            {g.completed > 0 && (
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                                Disbursed (
                                {g.completed})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Approve Dialog — sticky footer */}
      <Dialog
        open={!!selectedSeller}
        onOpenChange={(open) =>
          !open && setSelectedSeller(null)
        }
      >
        <DialogContent className="sm:max-w-[560px] rounded-lg border border-slate-200 shadow-none p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="px-10 pt-10 pb-4 shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Store className="h-6 w-6 text-amber-500" />
              {selectedSeller?.shopName}
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              {selectedSeller?.pendingCount}{" "}
              pending order(s) — review breakdown
              and approve.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-10 space-y-3 min-h-0">
            {selectedSeller?.payouts.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-slate-900">
                    #
                    {p.orders?.order_number ||
                      p.id
                        .slice(0, 8)
                        .toUpperCase()}
                  </span>
                  <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                    pending
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">
                      Gross
                    </span>
                    <span className="font-black text-slate-900">
                      {fmt(
                        Number(
                          p.gross_amount ||
                            p.amount,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">
                      Commission
                    </span>
                    <span className="font-bold text-rose-500">
                      -
                      {fmt(
                        Number(
                          p.commission_fee || 0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">
                      Pay Fee
                    </span>
                    <span className="font-bold text-rose-500">
                      -
                      {fmt(
                        Number(
                          p.payment_processing_fee ||
                            0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">
                      Tax
                    </span>
                    <span className="font-bold text-rose-500">
                      -
                      {fmt(
                        Number(
                          p.withholding_tax || 0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex justify-between">
                  <span className="font-black text-slate-900 text-sm">
                    Net
                  </span>
                  <span className="font-black text-emerald-600 text-sm">
                    {fmt(Number(p.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 border-t border-slate-100 bg-white px-10 pb-10 pt-5 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Total Net to Disburse
                </p>
                <p className="text-2xl font-black">
                  {fmt(
                    selectedSeller?.totalPendingAmount ||
                      0,
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Orders
                </p>
                <p className="text-2xl font-black">
                  {selectedSeller?.pendingCount}
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                selectedSeller &&
                handleApproveSeller(
                  selectedSeller,
                )
              }
              disabled={approving}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl h-14 shadow-xl shadow-amber-200 text-lg"
            >
              {approving
                ? "Approving..."
                : "Approve & Send to Finance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
