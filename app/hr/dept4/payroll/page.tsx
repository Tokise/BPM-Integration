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
  ChevronRight,
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
  validatePayroll,
  requestPayrollBudget,
  disbursePayroll,
  sendPayrollOTP,
  processPayroll,
  syncPayrollCalculations,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";

export default function PayrollManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (
    profile?.department as any
  )?.code;
  const roleStr = profile?.role?.toLowerCase() || "";
  const isHR4Admin =
    roleStr === "hr4_admin" ||
    (roleStr === "hr" && userDeptCode === "HR_DEPT4") ||
    roleStr === "admin";
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
  const [selectedPayslip, setSelectedPayslip] =
    useState<any>(null);
  const [isPayslipOpen, setIsPayslipOpen] =
    useState(false);
  const [selectedPayroll, setSelectedPayroll] =
    useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] =
    useState(false);
  const [isOtpSent, setIsOtpSent] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [viewMode, setViewMode] = useState<"summary" | "payslip">("summary");

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

    if (!isHR4Admin) {
      query = query.eq(
        "employee_id",
        profile?.id,
      );
    }

    const { data, error } = await query.order(
      "pay_period_end",
      {
        ascending: false,
      },
    );

    if (error) {
        toast.error("Failed to fetch payroll data");
    } else {
        setPayroll(data || []);
    }
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

  const handleOpenDisburse = async (
    id: string,
    amount: number,
  ) => {
    if (!profile?.email) {
      toast.error("User email not found for OTP");
      return;
    }

    const toastId = toast.loading(
      "Sending security code to your email...",
    );
    const res = await sendPayrollOTP(
      profile.id,
      profile.email,
    );

    if (res.success) {
      toast.success("Security code sent!", {
        id: toastId,
      });
      setActivePayrollId(id);
      setActiveAmount(amount);
      setShowOtpModal(true);
      setIsOtpSent(true);
    } else {
      toast.error(
        res.error || "Failed to send OTP",
        { id: toastId },
      );
    }
  };

  const handleConfirmDisburse = async () => {
    if (!activePayrollId || !profile?.id) return;
    toast.promise(
      disbursePayroll(
        activePayrollId,
        otpValue,
        profile.id,
      ),
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
    if (selectedPayroll?.id === activePayrollId) {
      setIsSheetOpen(false);
    }
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
    toast.promise(syncPayrollCalculations(), {
      loading: "Generating automated payroll based on HR3 & HR4 data...",
      success: () => {
        fetchPayroll();
        return "Payroll batch generated successfully";
      },
      error: (err) => `Sync failed: ${err.message || "Unknown error"}`,
    });
  };

  const filteredPayroll = payroll.filter((p) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (p.profiles?.full_name || "").toLowerCase().includes(searchLower) ||
      (p.profiles?.email || "").toLowerCase().includes(searchLower) ||
      (p.pay_period_start || "").toLowerCase().includes(searchLower) ||
      (p.pay_period_end || "").toLowerCase().includes(searchLower)
    );
  });

  const paginatedPayroll = filteredPayroll.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPayrollPages = Math.ceil(
    filteredPayroll.length / itemsPerPage,
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
              {isHR4Admin ? "Payroll Batches" : "My Payroll"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            {isHR4Admin ? "Payroll Batches" : "My Payroll & Payslips"}
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            {isHR4Admin 
              ? "Automated salary disbursements & tax compliance" 
              : "Personal salary disbursements & compliance"}
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
          {!isLogistics &&
            !isFinance &&
            isHR4Admin && (
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
              {isHR4Admin ? <Calculator className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {isHR4Admin ? "Total Payroll (Weekly)" : "Total Earnings (Weekly Cycle)"}
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
              {payroll.find(p => p.status !== 'disbursed')?.pay_period_end 
                ? new Date(payroll.find(p => p.status !== 'disbursed')?.pay_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : "TBD"}
            </h2>
            <p className="text-[10px] font-bold mt-2 text-slate-400">
              {isHR4Admin 
                ? `Preparing ${payroll.filter(p => p.status !== 'disbursed').length} payslips` 
                : "Your next scheduled disbursement"}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
          <CardContent className="p-8">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-100">
              <History className="h-5 w-5" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isHR4Admin ? "Process Status" : "Payroll Status"}
            </h4>
            <h2 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter uppercase">
              {payroll.length > 0 
                ? `${Math.round((payroll.filter(p => p.status === 'disbursed').length / payroll.length) * 100)}% Complete`
                : "Pending"}
            </h2>
            <div className="mt-3 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-100 transition-all duration-500" 
                style={{ width: `${payroll.length > 0 ? (payroll.filter(p => p.status === 'disbursed').length / payroll.length) * 100 : 0}%` }}
              />
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
                ? [1, 2, 3, 4, 5].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-50"
                    >
                      <td
                        colSpan={8}
                        className="h-24 px-8 py-6 bg-white"
                      />
                    </tr>
                  ))
                : paginatedPayroll.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedPayroll(p);
                        setIsSheetOpen(true);
                      }}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group cursor-pointer"
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
                          {p.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <MoreVertical className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {!loading && totalPayrollPages > 1 && (
            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Page {currentPage} of {totalPayrollPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2"
                >
                  <ChevronLeft className="h-3 w-3" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPayrollPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {filteredPayroll.length === 0 && !loading && (
            <div className="p-24 text-center bg-white border-t border-slate-50">
              <Banknote className="h-12 w-12 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                No current payroll records
              </p>
              <p className="text-slate-400 text-xs mt-3 font-medium">
                Your monthly payroll and tax records will appear here once generated.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Payroll Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) setViewMode("summary");
      }}>
        <SheetContent className="max-w-2xl w-full p-0 border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
          {selectedPayroll && (
            <div className="min-h-full flex flex-col relative">
              {viewMode === "summary" ? (
                <>
                  <SheetHeader className="p-10 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100">
                          {selectedPayroll.profiles?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <SheetTitle className="text-2xl font-black uppercase tracking-tighter">
                            Payroll Record
                          </SheetTitle>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Ref: {selectedPayroll.id.slice(0, 8)} • Cycle: Weekly ({selectedPayroll.pay_period_start})
                          </p>
                        </div>
                      </div>
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        selectedPayroll.status === "disbursed" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" :
                        selectedPayroll.status === "budget_approved" ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200" :
                        selectedPayroll.status === "budget_requested" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" :
                        selectedPayroll.status === "validated" ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200" :
                        "bg-slate-200 text-slate-600 ring-1 ring-slate-300"
                      }`}>
                        {selectedPayroll.status?.replace("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Base Salary</Label>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">
                          ₱{(selectedPayroll.base_salary || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
                        <Label className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block mb-2">Net Payout</Label>
                        <p className="text-2xl font-black text-emerald-700 tracking-tighter">
                          ₱{(selectedPayroll.net_pay || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="p-10 space-y-10 flex-1">
                    <div className="space-y-6">
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <History className="h-4 w-4 text-indigo-600" />
                        Daily Attendance Breakdown
                      </h3>
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
                        <div className="grid grid-cols-7 gap-2 text-center">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                            <div key={day} className="space-y-2">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{day}</p>
                              <div className="h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                                <span className="text-[10px] font-black text-slate-900">
                                  {/* Simulated breakdown for demo as per user request mapping logic */}
                                  {i === 0 || i === 6 ? "-" : "8h"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold mt-4 italic text-center uppercase tracking-widest">
                          Shift Basis: 8 Hours Regular • Overtime tracked separately
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Calculator className="h-4 w-4 text-indigo-600" />
                        Details & Deductions
                      </h3>
                      <div className="grid gap-3">
                        {[
                          { label: "Regular Salary (Weekly)", amount: selectedPayroll.base_salary, color: "text-slate-900" },
                          { label: "Overtime Pay", amount: selectedPayroll.ot_pay, color: "text-emerald-600", sign: "+" },
                          { label: "Total Deductions (Tax/SSS/Absence)", amount: selectedPayroll.deductions, color: "text-red-600", sign: "-" },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                            <span className={`text-sm font-black ${item.color}`}>
                              {item.sign}₱{(item.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100">
                      <div className="grid grid-cols-1 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setViewMode("payslip")}
                          className="h-14 rounded-2xl border-slate-200 text-slate-900 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transform active:scale-[0.98] transition-all"
                        >
                          <FileText className="h-5 w-5 text-indigo-600" />
                          Generate Official Payslip
                        </Button>

                        {isHR4Admin && (
                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {selectedPayroll.status === "pending" && (
                              <Button 
                                onClick={() => handleValidate(selectedPayroll.id)}
                                className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                              >
                                Validate Records
                              </Button>
                            )}

                            {selectedPayroll.status === "validated" && (
                              <Button 
                                onClick={() => handleRequestBudget(selectedPayroll.id, selectedPayroll.net_pay)}
                                className="h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-100"
                              >
                                Request Treasury Allotment
                              </Button>
                            )}

                            {selectedPayroll.status === "budget_requested" && (
                               <div className="p-8 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-200 text-center">
                                 <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest animate-pulse">
                                   Awaiting Finance Approval & Budget Allocation
                                 </p>
                               </div>
                            )}

                            {selectedPayroll.status === "budget_approved" && (
                              <Button 
                                onClick={() => handleOpenDisburse(selectedPayroll.id, selectedPayroll.net_pay)}
                                className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-100"
                              >
                                Commit Disbursement
                              </Button>
                            )}

                            {selectedPayroll.status === "disbursed" && (
                               <div className="p-8 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-200 flex items-center justify-center gap-4">
                                  <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5" />
                                  </div>
                                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                                    Successfully Disbursed
                                  </span>
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80">
                    <Button 
                      variant="ghost" 
                      onClick={() => setViewMode("summary")}
                      className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-slate-900"
                    >
                      <ChevronLeft className="h-4 w-4" /> Back to Record
                    </Button>
                    <div className="flex gap-2">
                       <Button variant="outline" className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200">
                         Export PDF
                       </Button>
                    </div>
                  </div>

                  <div className="p-10 space-y-8 bg-slate-50/50 flex-1">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-lg mx-auto transform hover:scale-[1.01] transition-transform duration-500">
                      {/* Payslip Visual - Professional Layout */}
                      <div className="bg-slate-900 p-10 text-white">
                        <div className="flex justify-between items-start mb-8">
                          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Banknote className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div className="text-right">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                              ID: #{selectedPayroll.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-1">Official Payslip</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ANEC Global HR Systems</p>
                      </div>

                      <div className="p-10 space-y-10">
                        <div className="grid grid-cols-2 gap-8 border-b border-slate-50 pb-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Personnel</p>
                            <div className="text-sm font-black text-slate-900"><PrivacyMask value={selectedPayroll.profiles?.full_name} /></div>
                            <p className="text-[10px] font-bold text-slate-400">{selectedPayroll.profiles?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Period</p>
                            <p className="text-sm font-black text-slate-900 italic">{selectedPayroll.pay_period_start} → {selectedPayroll.pay_period_end}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-4">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-2">Earnings</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-slate-500 uppercase">Monthly Base</span>
                                  <span className="font-black text-slate-900">₱{(selectedPayroll.base_salary || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-slate-500 uppercase">Other Additions</span>
                                  <span className="font-black text-emerald-600">+₱{(selectedPayroll.additions || 0).toLocaleString()}</span>
                                </div>
                              </div>
                           </div>

                           <div className="space-y-4 pt-4 border-t border-slate-50/50">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-2">Deductions</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-slate-500 uppercase">Total Reductions</span>
                                  <span className="font-black text-red-600">-₱{(selectedPayroll.deductions || 0).toLocaleString()}</span>
                                </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-8 text-white flex justify-between items-center shadow-xl">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Pay Grade</p>
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic">Total Payout</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-black text-emerald-400 tracking-tighter">₱{(selectedPayroll.net_pay || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* OTP Verification Modal */}
      <Dialog
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
      >
        <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl bg-white overflow-hidden">
          <div className="relative text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 shadow-inner mb-2 ring-8 ring-emerald-50/50">
              <ShieldCheck className="h-10 w-10 animate-bounce-subtle" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Security Verification
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                A 6-character code has been sent to<br/>
                <span className="text-emerald-500 font-black">{profile?.email}</span>
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="relative group">
                <Input
                  placeholder="ENTER 6-CHAR CODE"
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(e.target.value.toUpperCase())
                  }
                  className="h-16 text-center text-2xl font-black tracking-[0.5em] bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all uppercase placeholder:tracking-normal placeholder:text-xs placeholder:font-black placeholder:text-slate-300"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleConfirmDisburse}
                disabled={otpValue.length !== 6}
                className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
              >
                Verify & Disburse ₱
                {activeAmount.toLocaleString()}
              </Button>
              
              <div className="pt-2">
                 <button 
                  onClick={() => handleOpenDisburse(activePayrollId!, activeAmount)}
                  className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                >
                  Didn't receive code? Resend Code
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
