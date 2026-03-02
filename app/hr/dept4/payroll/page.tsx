"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Calculator,
  History,
  TrendingUp,
  FileText,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processPayroll } from "@/app/actions/hr_actions";

export default function PayrollManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [payroll, setPayroll] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");

  useEffect(() => {
    fetchPayroll();

    const channel = supabase
      .channel("payroll_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "payroll_management",
        },
        fetchPayroll,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("payroll_management")
      .select(
        `
        *,
        profiles (
          full_name
        )
      `,
      )
      .order("pay_period_end", {
        ascending: false,
      });

    setPayroll(data || []);
    setLoading(false);
  };

  const handleProcessPayroll = async (
    id: string,
    employeeId: string,
    netPay: number,
    payPeriodEnd: string,
  ) => {
    toast.promise(
      processPayroll(
        id,
        employeeId,
        netPay,
        payPeriodEnd,
      ),
      {
        loading:
          "Calculating taxes & syncing with Finance...",
        success:
          "Payroll processed and AP entry created",
        error: "Failed to process payroll",
      },
    );
    fetchPayroll();
  };

  const filteredPayroll = payroll.filter((p) =>
    p.profiles?.full_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() =>
                router.push("/hr/dept4")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              Payroll Batches
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Automated salary disbursements & tax
              compliance
            </p>
          </div>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-indigo-500/20">
            <Plus className="h-4 w-4 mr-2" />{" "}
            Generate New Batch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-slate-100/30 rounded-[32px] bg-indigo-600 text-white overflow-hidden relative">
            <CardContent className="p-8">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Calculator className="h-5 w-5" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Total Payroll (Oct)
              </h4>
              <h2 className="text-4xl font-black mt-1 tracking-tighter italic">
                ₱
                {payroll
                  .reduce(
                    (acc, curr) =>
                      acc +
                      (Number(curr.net_pay) || 0),
                    0,
                  )
                  .toLocaleString()}
              </h2>
              <p className="text-[10px] font-bold mt-2 opacity-80">
                +4.2% from last period
              </p>
              <TrendingUp className="absolute top-8 right-8 h-12 w-12 opacity-10" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100/30 rounded-[32px] bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <CreditCard className="h-5 w-5" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Next Pay Date
              </h4>
              <h2 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter italic">
                Nov 15
              </h2>
              <p className="text-[10px] font-bold mt-2 text-slate-400">
                Preparing 142 payslips
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100/30 rounded-[32px] bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <History className="h-5 w-5" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Process Status
              </h4>
              <h2 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter italic">
                85% Complete
              </h2>
              <div className="mt-3 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%] rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            placeholder="Search employee or period..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-indigo-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-100/50 overflow-hidden border border-slate-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Employee
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Pay Period
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Base Salary
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Net Pay
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tax Status
                </th>
                <th className="px-8 py-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-50"
                    >
                      <td
                        colSpan={6}
                        className="h-20 px-8 py-6"
                      />
                    </tr>
                  ))
                : filteredPayroll.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black italic">
                            {p.profiles?.full_name?.charAt(
                              0,
                            )}
                          </div>
                          <span className="font-bold text-slate-900">
                            {
                              p.profiles
                                ?.full_name
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-medium text-slate-500 text-xs">
                        {p.pay_period_start} →{" "}
                        {p.pay_period_end}
                      </td>
                      <td className="px-8 py-6 font-bold text-slate-400 text-xs tracking-tighter">
                        ₱
                        {(
                          p.gross_pay || 0
                        ).toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 italic">
                          ₱
                          {p.net_pay.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            p.status ===
                            "processed"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {p.status !==
                          "processed" ? (
                            <Button
                              onClick={() =>
                                handleProcessPayroll(
                                  p.id,
                                  p.employee_id,
                                  p.net_pay,
                                  p.pay_period_end,
                                )
                              }
                              className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest"
                            >
                              Process
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-slate-400"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filteredPayroll.length === 0 &&
            !loading && (
              <div className="p-32 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                  <Banknote className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 italic">
                  Waiting for Batch Initiation
                </h3>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
