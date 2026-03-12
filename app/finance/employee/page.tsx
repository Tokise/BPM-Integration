"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Receipt,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  ChevronRight,
  Filter,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrivacyMask } from "@/components/ui/privacy-mask";

export default function FinanceEmployeeDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingApproval: 0,
    readyToDisburse: 0,
    arOutstanding: 0,
  });
  const [recentTrans, setRecentTrans] = useState<
    any[]
  >([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch stats
    const [payoutsRes] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("payout_management")
        .select("amount, status"),
    ]);

    if (payoutsRes.data) {
      const data = payoutsRes.data;
      setStats({
        pendingApproval: data.filter(
          (p) => p.status === "pending",
        ).length,
        readyToDisburse: data.filter(
          (p) => p.status === "approved",
        ).length,
        arOutstanding: data.reduce(
          (acc, p) =>
            acc +
            (p.status !== "completed"
              ? Number(p.amount)
              : 0),
          0,
        ),
      });
    }

    // Fetch recent payouts
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("payout_management")
      .select(
        `
        *,
        shops:shop_id(name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (data) setRecentTrans(data);
    setLoading(false);
  };

  const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/finance">
                Finance Hub
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Clerk Portal
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Clerk Workspace
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Finance Operations • Ledger Processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push("/finance/collection")
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-indigo-100"
          >
            <CreditCard className="h-4 w-4 mr-2" />{" "}
            Disburse BATCH
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6 text-center">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Awaiting Ops Check
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {stats.pendingApproval}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6 text-center">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Banknote className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Qualified for Payout
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {stats.readyToDisburse}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden bg-indigo-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="h-10 w-10 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-full inline-block uppercase tracking-widest leading-none mb-2">
              Total Managed Vol
            </p>
            <p className="text-2xl font-black">
              <PrivacyMask
                value={fmt(stats.arOutstanding)}
              />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              Task Ledger
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="pl-8 h-8 text-xs rounded-lg bg-slate-50 border-none"
                  placeholder="Search entries..."
                />
              </div>
            </div>
          </div>

          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Account
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Value
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Flow
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px]"
                        >
                          Loading ledger...
                        </td>
                      </tr>
                    ) : recentTrans.length > 0 ? (
                      recentTrans.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-4">
                            <p className="text-sm font-black text-slate-900">
                              <PrivacyMask
                                value={
                                  tx.shops
                                    ?.name ||
                                  "Unknonwn Seller"
                                }
                              />
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">
                              Ref: #
                              {tx.id.slice(0, 8)}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-black text-slate-900">
                              <PrivacyMask
                                value={fmt(
                                  Number(
                                    tx.amount,
                                  ),
                                )}
                              />
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {tx.status ===
                              "completed" ? (
                                <div className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
                                  <ArrowDownRight className="h-3 w-3" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center">
                                  <ArrowUpRight className="h-3 w-3" />
                                </div>
                              )}
                              <span
                                className={`text-[10px] font-black uppercase tracking-tighter ${
                                  tx.status ===
                                  "completed"
                                    ? "text-emerald-600"
                                    : "text-indigo-600"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              className="h-8 rounded-lg text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                            >
                              Details{" "}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center text-slate-400 font-bold uppercase text-[10px]"
                        >
                          No recent ledger entries
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">
            Health Monitor
          </h2>
          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Reconciliation Rank
                </h4>
                <span className="text-xs font-black text-emerald-600">
                  Tier A+
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[95%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Disbursement Velocity
                </h4>
                <span className="text-xs font-black text-indigo-600">
                  8.2 hrs
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[78%]" />
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full h-11 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5 mr-2 text-slate-400" />{" "}
                Download Daily Report
              </Button>
            </div>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden bg-slate-900 p-6 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-widest">
                  System Alerts
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-300">
                    New batch reconciliation
                    required for ShopID-9281.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-300">
                    Inbound collection mismatch
                    detected in Core 3 ledger.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
