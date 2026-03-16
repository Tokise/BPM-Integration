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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Users,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
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

type Tab = "payable" | "receivable";

interface SellerPayable {
  shopName: string;
  ownerName: string;
  orders: number;
  totalOwed: number;
  totalPaid: number;
  pendingAmount: number;
  approvedAmount: number;
  payouts: any[];
}

interface SellerReceivable {
  shopName: string;
  orders: number;
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
}

import { sendPayrollOTP, approveInternalAPEntry } from "@/app/actions/hr_finance_actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";

export default function APARPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("payable");
  const [loading, setLoading] = useState(true);
  const [payables, setPayables] = useState<
    SellerPayable[]
  >([]);
  const [receivables, setReceivables] = useState<
    SellerReceivable[]
  >([]);
  const [rawPayouts, setRawPayouts] = useState<
    any[]
  >([]);

  const [selectedSeller, setSelectedSeller] =
    useState<SellerPayable | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [activeApId, setActiveApId] = useState<string | null>(null);
  const { profile: userProfile } = useUser();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: payouts } = await supabase
      .from("payout_management")
      .select(
        "id, order_id, amount, commission_fee, payment_processing_fee, withholding_tax, status, processed_at, approved_at, shops:shop_id(name, owner:profiles(full_name))",
      )
      .in("status", ["approved", "completed"])
      .order("processed_at", {
        ascending: false,
      });

    const all = payouts || [];
    setRawPayouts(all);

    // === AP: Group by seller ===
    const apMap: Record<string, SellerPayable> = {};
    all.forEach((p: any) => {
      const shopName = p.shops?.name || "Unknown";
      const ownerName = p.shops?.owner?.full_name || "Unknown";
      if (!apMap[shopName])
        apMap[shopName] = {
          shopName,
          ownerName,
          orders: 0,
          totalOwed: 0,
          totalPaid: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          payouts: [],
        };
      apMap[shopName].orders++;
      apMap[shopName].payouts.push(p);
      apMap[shopName].totalOwed += Number(p.amount);
      if (p.status === "completed") apMap[shopName].totalPaid += Number(p.amount);
      if (p.status === "pending") apMap[shopName].pendingAmount += Number(p.amount);
      if (p.status === "approved") apMap[shopName].approvedAmount += Number(p.amount);
    });

    // === AP/AR: Integration for Claims/Payroll ===
    const { data: apArData } = await supabase
      .schema("bpm-anec-global")
      .from("ap_ar")
      .select("*")
      .order("created_at", { ascending: false });

    if (apArData) {
      apArData.forEach((entry: any) => {
        if (entry.type === "payable") {
          const name = entry.entity_name || "Internal Payable";
          if (!apMap[name]) {
            apMap[name] = {
              shopName: name,
              ownerName: "Internal/Employee",
              orders: 0,
              totalOwed: 0,
              totalPaid: 0,
              pendingAmount: 0,
              approvedAmount: 0,
              payouts: [],
            };
          }
          apMap[name].orders++;
          // Map ap_ar entry to payout-like structure for the modal
          apMap[name].payouts.push({
            id: entry.id,
            amount: entry.amount,
            status: entry.status,
            processed_at: entry.created_at,
            isInternal: true,
            employee_id: entry.employee_id,
            reference_id: entry.reference_id,
            entity_name: entry.entity_name
          });
          apMap[name].totalOwed += Number(entry.amount);
          if (entry.status === "cleared" || entry.status === "paid")
            apMap[name].totalPaid += Number(entry.amount);
          else if (entry.status === "pending_approval" || entry.status === "unpaid")
            apMap[name].pendingAmount += Number(entry.amount);
        }
      });
    }

    setPayables(Object.values(apMap));

    const arMap: Record<string, SellerReceivable> = {};
    all.forEach((p: any) => {
      const shopName = p.shops?.name || "Unknown";
      const fees =
        Number(p.commission_fee || 0) +
        Number(p.payment_processing_fee || 0) +
        Number(p.withholding_tax || 0);
      if (!arMap[shopName])
        arMap[shopName] = {
          shopName,
          orders: 0,
          totalFees: 0,
          collectedFees: 0,
          pendingFees: 0,
        };
      arMap[shopName].orders++;
      arMap[shopName].totalFees += fees;
      if (p.status === "completed") arMap[shopName].collectedFees += fees;
      else arMap[shopName].pendingFees += fees;
    });

    if (apArData) {
      apArData.forEach((entry: any) => {
        if (entry.type === "receivable") {
          const name = entry.entity_name || "Misc Receivable";
          if (!arMap[name]) {
            arMap[name] = {
              shopName: name,
              orders: 0,
              totalFees: 0,
              collectedFees: 0,
              pendingFees: 0,
            };
          }
          const amt = Number(entry.amount);
          arMap[name].totalFees += amt;
          if (entry.status === "collected" || entry.status === "cleared")
            arMap[name].collectedFees += amt;
          else arMap[name].pendingFees += amt;
        }
      });
    }

    setReceivables(Object.values(arMap));

    setLoading(false);
  }, [supabase]);

  const handleOpenApprove = async (apId: string) => {
    if (!userProfile?.email) {
      toast.error("User email not found for OTP");
      return;
    }

    const toastId = toast.loading("Sending security code to your email...");
    const res = await sendPayrollOTP(userProfile.id, userProfile.email);

    if (res.success) {
      toast.success("Security code sent!", { id: toastId });
      setActiveApId(apId);
      setShowOtpModal(true);
    } else {
      toast.error(res.error || "Failed to send OTP", { id: toastId });
    }
  };

  const handleConfirmApprove = async () => {
    if (!activeApId || !userProfile?.id) return;
    
    toast.promise(
      approveInternalAPEntry(activeApId, otpValue, userProfile.id),
      {
        loading: "Verifying & syncing with Payroll...",
        success: "Approved! Funds allocated to HR4 Payroll",
        error: (e) => e.message || "Approval failed",
      }
    );
    
    setShowOtpModal(false);
    setOtpValue("");
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ch = supabase
      .channel("ap-ar-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payout_management",
        },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, fetchData]);

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // AP totals
  const apOutstanding = useMemo(
    () =>
      payables.reduce(
        (a, p) =>
          a + p.pendingAmount + p.approvedAmount,
        0,
      ),
    [payables],
  );
  const apPending = useMemo(
    () =>
      payables.reduce(
        (a, p) => a + p.pendingAmount,
        0,
      ),
    [payables],
  );
  const apApproved = useMemo(
    () =>
      payables.reduce(
        (a, p) => a + p.approvedAmount,
        0,
      ),
    [payables],
  );
  const apPaid = useMemo(
    () =>
      payables.reduce(
        (a, p) => a + p.totalPaid,
        0,
      ),
    [payables],
  );

  // AR totals
  const arTotal = useMemo(
    () =>
      receivables.reduce(
        (a, r) => a + r.totalFees,
        0,
      ),
    [receivables],
  );
  const arCollected = useMemo(
    () =>
      receivables.reduce(
        (a, r) => a + r.collectedFees,
        0,
      ),
    [receivables],
  );
  const arPending = useMemo(
    () =>
      receivables.reduce(
        (a, r) => a + r.pendingFees,
        0,
      ),
    [receivables],
  );

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
              Accounts Payable & Receivable
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
            Ledger Ops
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
            Core 2: AP/AR Management & Settlements
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-100 rounded-lg p-1.5 w-fit">
        <Button
          onClick={() => setTab("payable")}
          className={`rounded-md h-11 px-6 font-black text-sm transition-all ${tab === "payable" ? "bg-white text-slate-900 shadow-md" : "bg-transparent text-slate-500 hover:text-slate-700 shadow-none"}`}
        >
          <ArrowDownRight className="h-4 w-4 mr-2" />{" "}
          Accounts Payable
        </Button>
        <Button
          onClick={() => setTab("receivable")}
          className={`rounded-md h-11 px-6 font-black text-sm transition-all ${tab === "receivable" ? "bg-white text-slate-900 shadow-md" : "bg-transparent text-slate-500 hover:text-slate-700 shadow-none"}`}
        >
          <ArrowUpRight className="h-4 w-4 mr-2" />{" "}
          Accounts Receivable
        </Button>
      </div>

      {tab === "payable" ? (
        <>
          {/* AP Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: "Gross Obligations",
                value: fmt(apOutstanding),
                color: "rose",
                trend: "+2.4%",
              },
              {
                label: "Awaiting Ops Approval",
                value: fmt(apPending),
                color: "amber",
                trend: "-1.2%",
              },
              {
                label: "Verified for Transfer",
                value: fmt(apApproved),
                color: "indigo",
                trend: "+5.7%",
              },
              {
                label: "Settled Life-to-Date",
                value: fmt(apPaid),
                color: "emerald",
                trend: "+12.1%",
              },
            ].map((s) => (
              <Card
                key={s.label}
                className="border border-slate-200 shadow-none rounded-lg p-6 bg-white relative overflow-hidden group"
              >
                <div className="relative">
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2`}
                  >
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {loading ? (
                      "..."
                    ) : (
                      <PrivacyMask
                        value={s.value}
                      />
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4">
                    <span className={`text-[9px] font-black bg-${s.color}-50 text-${s.color}-600 px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1`}>
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {s.trend}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      vs prev
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* AP Table — grouped by seller */}
          <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">
                Accounts Payable Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Seller
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Orders
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Outstanding
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Settled
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Status
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
                            colSpan={5}
                            className="p-8 bg-slate-50/20"
                          />
                        </tr>
                      ))
                    ) : payables.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-slate-400 font-bold italic"
                        >
                          No payable records.
                        </td>
                      </tr>
                    ) : (
                      payables.map((p) => (
                        <tr
                          key={p.shopName}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Store className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <span className="font-black text-slate-900 text-sm block">
                                  {p.shopName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {p.ownerName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                              {p.orders} order
                              {p.orders > 1
                                ? "s"
                                : ""}
                            </span>
                          </td>
                          <td className="p-5 font-black text-red-600 text-sm">
                            <PrivacyMask
                              value={fmt(
                                p.pendingAmount +
                                  p.approvedAmount,
                              )}
                            />
                          </td>
                          <td className="p-5 font-black text-emerald-600 text-sm">
                            <PrivacyMask
                              value={fmt(
                                p.totalPaid,
                              )}
                            />
                          </td>
                          <td className="p-5 text-right">
                            {p.pendingAmount >
                              0 && (
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 mr-1">
                                Pending{" "}
                                {fmt(
                                  p.pendingAmount,
                                )}
                              </span>
                            )}
                            {p.approvedAmount >
                              0 && (
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 mr-1">
                                Finance{" "}
                                {fmt(
                                  p.approvedAmount,
                                )}
                              </span>
                            )}
                            {p.totalPaid > 0 &&
                              p.pendingAmount ===
                                0 &&
                              p.approvedAmount ===
                                0 && (
                                <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                                  Fully Paid
                                </span>
                              )}
                          </td>
                          <td className="p-5 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setSelectedSeller(
                                  p,
                                )
                              }
                              className="h-8 w-8 hover:bg-slate-100 rounded-lg"
                            >
                              <Eye className="h-4 w-4 text-slate-400 hover:text-primary" />
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

          {/* Payroll placeholder */}
          <Card className="border border-slate-200 shadow-none rounded-lg p-8 bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white border border-slate-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">
                  Employee Payroll
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  Payroll will appear here once HR
                  approval flow is integrated.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* AR Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label:
                  "Aggregate Platform Revenue",
                value: fmt(arTotal),
                color: "emerald",
              },
              {
                label: "Settled Collections",
                value: fmt(arCollected),
                color: "indigo",
              },
              {
                label: "Pending Invoices",
                value: fmt(arPending),
                color: "amber",
              },
            ].map((s) => (
              <Card
                key={s.label}
                className="border border-slate-200 shadow-none rounded-lg p-6 bg-white relative overflow-hidden group"
              >
                <div className="relative">
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2`}
                  >
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {loading ? (
                      "..."
                    ) : (
                      <PrivacyMask
                        value={s.value}
                      />
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4">
                    <span className={`text-[9px] font-black bg-${s.color}-50 text-${s.color}-600 px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1`}>
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      +3.8%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      vs prev
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* AR Table — grouped by seller */}
          <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Revenue Ledger by Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Seller
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Volume
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Gross Fees
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Settled
                      </th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Status
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
                    ) : receivables.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-slate-400 font-bold italic"
                        >
                          No receivables yet.
                        </td>
                      </tr>
                    ) : (
                      receivables.map((r) => (
                        <tr
                          key={r.shopName}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Store className="h-4 w-4 text-emerald-500" />
                              </div>
                              <span className="font-black text-slate-900 text-sm">
                                {r.shopName}
                              </span>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                              {r.orders} order
                              {r.orders > 1
                                ? "s"
                                : ""}
                            </span>
                          </td>
                          <td className="p-5 font-black text-emerald-600 text-sm">
                            <PrivacyMask
                              value={fmt(
                                r.totalFees,
                              )}
                            />
                          </td>
                          <td className="p-5">
                            <span
                              className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${r.collectedFees > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                            >
                              <PrivacyMask
                                value={fmt(
                                  r.collectedFees,
                                )}
                              />
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            {r.pendingFees > 0 ? (
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
                                {fmt(
                                  r.pendingFees,
                                )}
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                                Fully Collected
                              </span>
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
        </>
      )}

      {/* Payout Details Modal */}
      <Dialog
        open={!!selectedSeller}
        onOpenChange={(open) =>
          !open && setSelectedSeller(null)
        }
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-lg p-0 border-none bg-slate-50">
          <DialogHeader className="p-8 border-b border-slate-200 bg-white sticky top-0 z-10">
            <DialogTitle className="text-2xl font-black">
              Payout Details for{" "}
              {selectedSeller?.shopName}
            </DialogTitle>
            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">
              {selectedSeller?.ownerName}
            </p>
          </DialogHeader>
          <div className="p-8 space-y-4">
            {selectedSeller?.payouts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm hover:border-slate-200 transition-colors"
              >
                <div className="grid grid-cols-4 gap-6 items-center">
                  <div className="col-span-1 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Ref
                    </p>
                    <p className="font-bold text-slate-900 truncate">
                      #
                      {p.order_id
                        ?.toString()
                        .slice(0, 8) ||
                        p.orders?.id
                          ?.toString()
                          .slice(0, 8) ||
                        p.id.split("-")[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                      {new Date(
                        p.processed_at ||
                          p.approved_at ||
                          Date.now(),
                      ).toLocaleDateString(
                        "en-PH",
                        { dateStyle: "medium" },
                      )}
                    </p>
                  </div>

                  <div className="col-span-1 text-center border-l border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Fees Deducted
                    </p>
                    <p className="text-sm font-bold text-red-500 mt-1">
                      -
                      {fmt(
                        Number(
                          p.commission_fee || 0,
                        ) +
                          Number(
                            p.payment_processing_fee ||
                              0,
                          ) +
                          Number(
                            p.withholding_tax ||
                              0,
                          ),
                      )}
                    </p>
                  </div>

                  <div className="col-span-1 text-center border-l border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Net Payout
                    </p>
                    <p className="text-lg font-black text-emerald-600 mt-1">
                      {fmt(Number(p.amount))}
                    </p>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    {p.isInternal && (p.status === "unpaid" || p.status === "pending_approval") ? (
                      <Button
                        onClick={() => handleOpenApprove(p.id)}
                        className="h-8 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                      >
                        Approve & Budget
                      </Button>
                    ) : (
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${
                          p.status === "completed" || p.status === "cleared" || p.status === "paid"
                            ? "bg-emerald-50 text-emerald-600"
                            : p.status === "approved"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {selectedSeller?.payouts.length ===
              0 && (
              <p className="text-center text-slate-500 font-bold p-8">
                No payout records found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="sm:max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Security Verification
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter the 6-digit code sent to your email to authorize this budget allocation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Verification Code
                </Label>
                <Input
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.toUpperCase())}
                  placeholder="EX: ABC123"
                  className="h-12 text-center text-lg font-black tracking-[0.2em] rounded-lg border-slate-200 focus-visible:ring-indigo-500 uppercase"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleConfirmApprove}
                disabled={otpValue.length < 6}
                className="w-full h-12 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-none uppercase tracking-widest text-[10px]"
              >
                Authorize & Sync Payroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
