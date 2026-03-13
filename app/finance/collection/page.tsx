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
  History,
  CheckCircle2,
  ChevronRight,
  Receipt,
  Store,
  Banknote,
  Send,
  Copy,
  ArrowUpRight,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";

interface PayoutRecord {
  id: string;
  shop_id: string;
  order_id: string;
  amount: number;
  gross_amount: number;
  commission_fee: number;
  payment_processing_fee: number;
  withholding_tax: number;
  status: string;
  reference_number: string | null;
  approved_at: string | null;
  disbursed_by: string | null;
  processed_at: string | null;
  orders: { order_number: string } | null;
  shops: { name: string } | null;
}

interface SellerGroup {
  shopId: string;
  shopName: string;
  ownerName: string;
  approvedCount: number;
  totalAmount: number;
  totalGross: number;
  payouts: PayoutRecord[];
}

export default function CollectionPage() {
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
  const [disbursing, setDisbursing] =
    useState(false);
  const [recentDisbursed, setRecentDisbursed] =
    useState<PayoutRecord[]>([]);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payout_management")
      .select(
        "*, orders(order_number), shops:shop_id(name)",
      )
      .in("status", ["approved", "completed"])
      .order("approved_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch payouts");
      setLoading(false);
      return;
    }

    const records = (data ||
      []) as PayoutRecord[];
    setPayouts(records);
    setRecentDisbursed(
      records
        .filter((p) => p.status === "completed")
        .slice(0, 10),
    );

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
          name: s.name || "Unknown",
          ownerName:
            s.owner?.full_name || "Unknown",
        };
      });

      const groups: Record<string, SellerGroup> =
        {};
      records
        .filter((p) => p.status === "approved")
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
              approvedCount: 0,
              totalAmount: 0,
              totalGross: 0,
              payouts: [],
            };
          }
          groups[p.shop_id].approvedCount++;
          groups[p.shop_id].totalAmount += Number(
            p.amount,
          );
          groups[p.shop_id].totalGross += Number(
            p.gross_amount || p.amount,
          );
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
      .channel("finance-payout-changes")
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

  const handleDisburse = async (
    group: SellerGroup,
  ) => {
    if (!profile?.id) return;
    setDisbursing(true);
    try {
      const payoutIds = group.payouts.map(
        (p) => p.id,
      );
      // Use seller ID as the reference since no bank yet
      const sellerRef = `SELLER-${group.shopId.slice(0, 8).toUpperCase()}`;

      const { error } = await supabase
        .from("payout_management")
        .update({
          status: "completed",
          disbursed_by: profile.id,
          reference_number: sellerRef,
          processed_at: new Date().toISOString(),
        })
        .in("id", payoutIds);
      if (error) throw error;

      await supabase.from("audit_logs").insert(
        payoutIds.map((pid) => ({
          user_id: profile.id,
          action: "payout_disbursed",
          entity_type: "payout",
          entity_id: pid,
          details: {
            shop_id: group.shopId,
            shop_name: group.shopName,
            total_amount: group.totalAmount,
            reference_number: sellerRef,
          },
        })),
      );

      toast.success(
        `Disbursed ${fmt(group.totalAmount)} to ${group.shopName}`,
      );
      setSelectedSeller(null);
      fetchPayouts();
    } catch {
      toast.error("Failed to disburse payouts");
    } finally {
      setDisbursing(false);
    }
  };

  const approvedTotal = payouts
    .filter((p) => p.status === "approved")
    .reduce((a, p) => a + Number(p.amount), 0);
  const disbursedTotal = payouts
    .filter((p) => p.status === "completed")
    .reduce((a, p) => a + Number(p.amount), 0);
  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/finance">
                Finance Hub
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Collection Hub
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Collection Hub
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
            Core 3: Disbursement & Collection
            Operations
          </p>
        </div>
        {sellerGroups.length > 0 && (
          <div className="bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 border border-indigo-100">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
              {sellerGroups.length} batches
              pending
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white relative overflow-hidden group">
          <div className="relative">
            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <Banknote className="h-6 w-6 text-indigo-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Pending for Disbursement
            </p>
            <p className="text-3xl font-black text-slate-900 leading-none uppercase tracking-tighter">
              <PrivacyMask value={fmt(approvedTotal)} />
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +4.2% trend
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                vs last month
              </span>
            </div>
          </div>
        </Card>
        <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-white relative overflow-hidden group">
          <div className="relative">
            <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center mb-6">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Life-to-Date Disbursed
            </p>
            <p className="text-3xl font-black text-slate-900 leading-none uppercase tracking-tighter">
              <PrivacyMask
                value={fmt(disbursedTotal)}
              />
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +12.8% growth
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                overall
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Approved Queue */}
      <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-200 flex flex-row items-center justify-between bg-white">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">
            Pending Dispatches
          </CardTitle>
          <Landmark className="h-5 w-5 text-slate-300" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Seller Account
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Batch Volume
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Net Transfer
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Review
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
                        colSpan={4}
                        className="p-10 bg-slate-50/20"
                      />
                    </tr>
                  ))
                ) : sellerGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-20 text-center"
                    >
                      <Banknote className="h-12 w-12 text-slate-100 mb-4 mx-auto" />
                      <p className="text-slate-400 font-bold italic">
                        No approved payouts
                        waiting.
                      </p>
                    </td>
                  </tr>
                ) : (
                  sellerGroups.map((g) => (
                    <tr
                      key={g.shopId}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={() =>
                        setSelectedSeller(g)
                      }
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
                            <Store className="h-4 w-4 text-indigo-500" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-sm block">
                              <PrivacyMask
                                value={g.shopName}
                              />
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                              Owner:{" "}
                              <PrivacyMask
                                value={
                                  g.ownerName
                                }
                              />
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                          {g.approvedCount} items
                        </span>
                      </td>
                      <td className="p-6 font-black text-slate-900 text-lg">
                        <PrivacyMask
                          value={fmt(
                            g.totalAmount,
                          )}
                        />
                      </td>
                      <td className="p-6 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeller(g);
                          }}
                          className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase rounded-lg h-9 px-6 gap-2"
                        >
                          Disburse
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

      {/* Recently Disbursed — grouped by seller */}
      {recentDisbursed.length > 0 &&
        (() => {
          const disbursedGroups: Record<
            string,
            {
              shopName: string;
              orders: number;
              totalAmount: number;
              reference: string;
              date: string;
            }
          > = {};
          recentDisbursed.forEach((p) => {
            const shopName =
              (p.shops as any)?.name ||
              p.shop_id.slice(0, 8);
            if (!disbursedGroups[shopName])
              disbursedGroups[shopName] = {
                shopName,
                orders: 0,
                totalAmount: 0,
                reference:
                  p.reference_number || "—",
                date: p.processed_at || "",
              };
            disbursedGroups[shopName].orders++;
            disbursedGroups[
              shopName
            ].totalAmount += Number(p.amount);
          });
          const groups = Object.values(
            disbursedGroups,
          );
          return (
            <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
              <CardHeader className="p-6 border-b border-slate-200 flex flex-row items-center justify-between bg-white">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Completed Transfers
                </CardTitle>
                <History className="h-5 w-5 text-slate-300" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Recipient
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Volume
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Settlement
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Reference
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {groups.map((g) => (
                        <tr
                          key={g.shopName}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center">
                                <Store className="h-4 w-4 text-emerald-500" />
                              </div>
                              <span className="font-black text-slate-900 text-sm">
                                {g.shopName}
                              </span>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                              {g.orders} order
                              {g.orders > 1
                                ? "s"
                                : ""}
                            </span>
                          </td>
                          <td className="p-5 font-black text-emerald-600 text-sm">
                            {fmt(g.totalAmount)}
                          </td>
                          <td className="p-5 text-xs font-bold text-slate-500">
                            {g.reference}
                          </td>
                          <td className="p-5 text-right text-[10px] font-bold text-slate-400">
                            {g.date
                              ? new Date(
                                  g.date,
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

      {/* Disburse Dialog — seller ID auto-added, sticky footer */}
      <Dialog
        open={!!selectedSeller}
        onOpenChange={(open) => {
          if (!open) setSelectedSeller(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-lg border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="px-10 pt-10 pb-4 shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Receipt className="h-6 w-6 text-blue-500" />
              Disburse to{" "}
              {selectedSeller?.shopName}
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Review breakdown and send to seller.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-10 space-y-3 min-h-0">
            {selectedSeller?.payouts.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 p-4 rounded-lg border border-slate-100"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs text-slate-900">
                    #
                    {p.orders?.order_number ||
                      p.id
                        .slice(0, 8)
                        .toUpperCase()}
                  </span>
                  <span className="font-black text-emerald-600 text-sm">
                    {fmt(Number(p.amount))}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <span className="text-slate-400 font-bold">
                    Com:{" "}
                    {fmt(
                      Number(
                        p.commission_fee || 0,
                      ),
                    )}
                  </span>
                  <span className="text-slate-400 font-bold">
                    Fee:{" "}
                    {fmt(
                      Number(
                        p.payment_processing_fee ||
                          0,
                      ),
                    )}
                  </span>
                  <span className="text-slate-400 font-bold">
                    Tax:{" "}
                    {fmt(
                      Number(
                        p.withholding_tax || 0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white px-10 pb-10 pt-5 space-y-4">
            <div className="bg-slate-900 rounded-lg p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">
                  Total Transfer
                </p>
                <p className="text-2xl font-black">
                  {fmt(
                    selectedSeller?.totalAmount ||
                      0,
                  )}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-200" />
            </div>

            {/* Seller ID auto-populated */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Seller ID (Auto-generated)
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-4 py-3 font-mono font-black text-slate-900 text-sm border border-slate-100">
                  SELLER-
                  {selectedSeller?.shopId
                    .slice(0, 8)
                    .toUpperCase()}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `SELLER-${selectedSeller?.shopId.slice(0, 8).toUpperCase()}`,
                    )
                  }
                  className="h-10 w-10 p-0 rounded-xl border-slate-200"
                >
                  <Copy className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            </div>

            <Button
              onClick={() =>
                selectedSeller &&
                handleDisburse(selectedSeller)
              }
              disabled={disbursing}
              className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-lg h-14 shadow-none text-lg"
            >
              {disbursing
                ? "Processing..."
                : "Complete Transfer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
