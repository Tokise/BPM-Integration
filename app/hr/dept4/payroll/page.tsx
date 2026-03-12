"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  Calculator,
  History,
  TrendingUp,
  FileText,
  CreditCard,
  MapPin,
  ChevronLeft,
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
import { processPayroll } from "@/app/actions/hr_finance_actions";
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

  const handleGenerateBatch = async () => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          const { data: emps } = await supabase
            .schema("bpm-anec-global")
            .from("profiles")
            .select("id, full_name")
            .not(
              "role",
              "in",
              '("customer","seller")',
            );

          const { data: comp } = await supabase
            .schema("bpm-anec-global")
            .from("compensation_management")
            .select("*");

          const now = new Date();
          const pStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          )
            .toISOString()
            .split("T")[0];
          const pEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
          )
            .toISOString()
            .split("T")[0];

          const payrollEntries = (emps || []).map(
            (e) => {
              const c = (comp || []).find(
                (x) => x.employee_id === e.id,
              );
              const base = Number(
                c?.base_salary || 25000,
              );
              return {
                employee_id: e.id,
                base_salary: base,
                net_pay: base,
                pay_period_start: pStart,
                pay_period_end: pEnd,
                status: "pending",
              };
            },
          );

          const { error } = await supabase
            .schema("bpm-anec-global")
            .from("payroll_management")
            .insert(payrollEntries);

          if (error) reject(error);
          else resolve(true);
        } catch (e) {
          reject(e);
        }
      }),
      {
        loading:
          "Initializing payroll batch for current period...",
        success: "Batch generated successfully",
        error: "Failed to generate batch",
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
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr">HR Hub</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr/dept4">
                Payroll (Dept 4)
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Payroll Batches
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Payroll Batches
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Automated salary disbursements & tax
            compliance
          </p>
        </div>

        <Button
          onClick={handleGenerateBatch}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px] flex items-center gap-3"
        >
          <Plus className="h-4 w-4" /> Generate
          New Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-indigo-600 text-white overflow-hidden relative group">
          <CardContent className="p-8">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
              <Calculator className="h-5 w-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Total Payroll (Oct)
            </h4>
            <h2 className="text-4xl font-black mt-1 tracking-tighter italic">
              ₱
              <PrivacyMask
                value={payroll
                  .reduce(
                    (acc, curr) =>
                      acc +
                      (Number(curr.net_pay) || 0),
                    0,
                  )
                  .toLocaleString()}
              />
            </h2>
            <p className="text-[10px] font-bold mt-2 opacity-80">
              +4.2% from last period
            </p>
            <TrendingUp className="absolute top-8 right-8 h-12 w-12 opacity-10 group-hover:scale-110 transition-transform" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden group">
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

        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
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
              <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-lg shadow-emerald-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <Input
          placeholder="Search employee or period..."
          className="pl-11 h-14 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl focus-visible:ring-indigo-500 font-medium"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
        />
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-100 overflow-hidden border border-slate-50">
        <div className="overflow-x-auto">
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
                  Status
                </th>
                <th className="px-8 py-6 text-right"></th>
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
                        className="h-24 px-8 py-6 bg-white"
                      />
                    </tr>
                  ))
                : filteredPayroll.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black italic">
                            {p.profiles?.full_name?.charAt(
                              0,
                            )}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block tracking-tight">
                              <PrivacyMask
                                value={
                                  p.profiles
                                    ?.full_name ||
                                  "Unknown"
                                }
                              />
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="h-3 w-3" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">
                                Remote Office
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            {p.pay_period_start} →{" "}
                            {p.pay_period_end}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            October Cycle
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-400 tracking-tighter">
                          ₱
                          <PrivacyMask
                            value={(
                              p.base_salary || 0
                            ).toLocaleString()}
                          />
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 italic tracking-tighter">
                          ₱
                          <PrivacyMask
                            value={(
                              p.net_pay || 0
                            ).toLocaleString()}
                          />
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            p.status ===
                            "processed"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500 animate-pulse"
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
                              className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                            >
                              Process
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl text-slate-400 hover:bg-slate-50"
                            >
                              <FileText className="h-5 w-5" />
                            </Button>
                          )}
                          <button className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </button>
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
