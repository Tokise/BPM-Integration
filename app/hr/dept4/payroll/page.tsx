"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Search,
  Plus,
  FilePlus, // Added
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
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import { toast } from "sonner";
import {
  processPayroll,
  validatePayroll,
  requestPayrollBudget,
  disbursePayroll,
} from "@/app/actions/hr_finance_actions";
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
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (
    profile?.departments as any
  )?.code;
  const isDept1 =
    pathname.startsWith("/hr/dept1");
  const isDept2 =
    pathname.startsWith("/hr/dept2");
  const isDept3 =
    pathname.startsWith("/hr/dept3");
  const isLogistics = profile?.role
    ?.toLowerCase()
    .startsWith("logistic");
  const isFinance = profile?.role
    ?.toLowerCase()
    .startsWith("finance");
  const baseUrl = pathname.startsWith("/finance")
    ? "/finance"
    : pathname.startsWith("/logistic/dept1")
      ? "/logistic/dept1"
      : pathname.startsWith(
            "/logistic/dept2/driver",
          )
        ? "/logistic/dept2/driver"
        : pathname.startsWith("/logistic/dept2")
          ? "/logistic/dept2"
          : isDept1
            ? "/hr/dept1"
            : isDept2
              ? "/hr/dept2"
              : isDept3
                ? "/hr/dept3"
                : "/hr/dept4";
  const [payroll, setPayroll] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [showOtpModal, setShowOtpModal] =
    useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [activePayrollId, setActivePayrollId] =
    useState<string | null>(null);
  const [activeAmount, setActiveAmount] =
    useState<number>(0);

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
    let query = supabase
      .schema("bpm-anec-global")
      .from("payroll_management")
      .select(
        `
        *,
        profiles (
          full_name
        )
      `,
      );

    if (
      isDept1 ||
      isDept2 ||
      isDept3 ||
      isLogistics ||
      isFinance
    ) {
      query = query.eq(
        "employee_id",
        profile?.id,
      );
    }

    const { data } = await query.order(
      "pay_period_end",
      {
        ascending: false,
      },
    );

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

  const simulateFinanceApprove = async (
    id: string,
  ) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("payroll_management")
      .update({ status: "budget_approved" })
      .eq("id", id);

    if (error) toast.error("Simulation failed");
    else {
      toast.success(
        "Finance approved the budget (Simulated)",
      );
      fetchPayroll();
    }
  };

  const handleValidate = async (id: string) => {
    toast.promise(validatePayroll(id), {
      loading: "Validating payroll entries...",
      success: "Payroll validated",
      error: "Validation failed",
    });
    fetchPayroll();
  };

  const handleRequestBudget = async (
    id: string,
    amount: number,
  ) => {
    toast.promise(
      requestPayrollBudget(id, amount),
      {
        loading:
          "Sending budget request to Finance...",
        success: "Budget request sent",
        error: "Failed to send request",
      },
    );
    fetchPayroll();
  };

  const handleOpenDisburse = (
    id: string,
    amount: number,
  ) => {
    setActivePayrollId(id);
    setActiveAmount(amount);
    setShowOtpModal(true);
  };

  const handleConfirmDisburse = async () => {
    if (!activePayrollId) return;
    toast.promise(
      disbursePayroll(activePayrollId, otpValue),
      {
        loading:
          "Verifying OTP and disbursing funds...",
        success: "Funds disbursed successfully",
        error: (e) =>
          e.message || "Disbursement failed",
      },
    );
    setShowOtpModal(false);
    setOtpValue("");
    fetchPayroll();
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
  ) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("payroll_management")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Payroll status updated");
      fetchPayroll();
    }
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

          const { data: leaves } = await supabase
            .schema("bpm-anec-global")
            .from("leave_management")
            .select("*")
            .eq("status", "approved");

          const { data: claims } = await supabase
            .schema("bpm-anec-global")
            .from("claims_reimbursement")
            .select("*")
            .eq("status", "approved");

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

              // Calculate deductions (e.g. 500 per leave day for now)
              const empLeaves = (
                leaves || []
              ).filter(
                (l) => l.employee_id === e.id,
              );
              const deductions =
                empLeaves.length * 500;

              // Calculate additions (claims)
              const empClaims = (
                claims || []
              ).filter(
                (cl) =>
                  cl.employee_id === e.id ||
                  cl.employee_name ===
                    e.full_name,
              );
              const additions = empClaims.reduce(
                (acc, curr) =>
                  acc + Number(curr.amount || 0),
                0,
              );

              const tax = base * 0.1; // 10% tax
              const net =
                base +
                additions -
                deductions -
                tax;

              return {
                employee_id: e.id,
                base_salary: base,
                net_pay: net,
                deductions: deductions + tax,
                additions: additions,
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
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href={baseUrl}>
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Payroll Batches
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Payroll Batches
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Automated salary disbursements & tax
            compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <Input
              placeholder="Search employee or period..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-indigo-500 font-medium text-xs"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
          {!isDept1 &&
            !isDept2 &&
            !isDept3 &&
            !isLogistics &&
            !isFinance && (
              <Button
                onClick={handleGenerateBatch}
                className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3"
              >
                <FilePlus className="h-4 w-4" />{" "}
                Generate Batch
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-indigo-200 shadow-none rounded-lg bg-indigo-600 text-white overflow-hidden relative group">
          <CardContent className="p-8">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center mb-6">
              <Calculator className="h-5 w-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Total Payroll (Oct)
            </h4>
            <h2 className="text-3xl font-black mt-1 tracking-tighter uppercase">
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

        <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden group">
          <CardContent className="p-8">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-6 border border-amber-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Next Pay Date
            </h4>
            <h2 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter uppercase">
              Nov 15
            </h2>
            <p className="text-[10px] font-bold mt-2 text-slate-400">
              Preparing 142 payslips
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
          <CardContent className="p-8">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-100">
              <History className="h-5 w-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Process Status
            </h4>
            <h2 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter uppercase">
              85% Complete
            </h2>
            <div className="mt-3 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-lg shadow-emerald-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-none overflow-hidden border border-slate-200">
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
                  Additions
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Deductions
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
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black border border-indigo-100">
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
                        <span className="text-xs font-bold text-emerald-600 tracking-tighter">
                          +₱
                          <PrivacyMask
                            value={(
                              p.additions || 0
                            ).toLocaleString()}
                          />
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-red-600 tracking-tighter">
                          -₱
                          <PrivacyMask
                            value={(
                              p.deductions || 0
                            ).toLocaleString()}
                          />
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">
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
                            "disbursed"
                              ? "bg-emerald-50 text-emerald-600"
                              : p.status ===
                                  "budget_approved"
                                ? "bg-indigo-50 text-indigo-600"
                                : p.status ===
                                    "budget_requested"
                                  ? "bg-amber-50 text-amber-600"
                                  : p.status ===
                                      "validated"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.status?.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {!isDept1 &&
                            !isDept2 &&
                            !isDept3 && (
                              <>
                                {p.status ===
                                  "pending" && (
                                  <Button
                                    onClick={() =>
                                      handleValidate(
                                        p.id,
                                      )
                                    }
                                    className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-none"
                                  >
                                    Validate
                                  </Button>
                                )}
                                {p.status ===
                                  "validated" && (
                                  <Button
                                    onClick={() =>
                                      handleRequestBudget(
                                        p.id,
                                        p.net_pay,
                                      )
                                    }
                                    className="h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest shadow-none"
                                  >
                                    Request Budget
                                  </Button>
                                )}
                                <div className="flex flex-col gap-1 items-end">
                                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic animate-pulse">
                                    Awaiting
                                    Finance...
                                  </span>
                                  <Button
                                    onClick={() =>
                                      simulateFinanceApprove(
                                        p.id,
                                      )
                                    }
                                    variant="ghost"
                                    className="h-6 px-2 text-[8px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                                  >
                                    [Simulate
                                    Finance
                                    Approval]
                                  </Button>
                                </div>
                                {p.status ===
                                  "budget_approved" && (
                                  <Button
                                    onClick={() =>
                                      handleOpenDisburse(
                                        p.id,
                                        p.net_pay,
                                      )
                                    }
                                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest shadow-none"
                                  >
                                    Disburse
                                  </Button>
                                )}
                                {p.status ===
                                  "disbursed" && (
                                  <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      Distributed
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                          {(isDept1 ||
                            isDept2 ||
                            isDept3) && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              {p.status ===
                              "disbursed"
                                ? "Paid"
                                : "Processing..."}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filteredPayroll.length === 0 &&
            !loading && (
              <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50 mt-8">
                <Banknote className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                  No current payroll records
                </p>
                <p className="text-slate-400 text-xs mt-3 font-medium">
                  Your monthly payroll and tax
                  records will appear here once
                  generated by the HR admin.
                </p>
              </div>
            )}
        </div>
      </div>
      <Dialog
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
      >
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="p-8 space-y-6 text-center">
            <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Confirm Disbursement
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                You are about to disburse ₱
                {activeAmount.toLocaleString()} to
                this employee. Please enter the
                OTP sent to your admin device.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(e.target.value)
                  }
                  className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500 font-black text-center text-xl tracking-[0.5em]"
                />
              </div>
              <Button
                onClick={handleConfirmDisburse}
                disabled={otpValue.length !== 6}
                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Verify & Release Funds
              </Button>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Mock OTP for Demo: 123456
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
