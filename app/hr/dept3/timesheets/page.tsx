"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  FileCheck,
  Search,
  Download,
  Calendar as CalendarIcon,
  ChevronLeft,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  User,
  Activity,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import { approveTimesheet } from "@/app/actions/hr_finance_actions";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

const formatDuration = (decimalHours: number) => {
  const totalSeconds = Math.round(decimalHours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
};

export default function TimesheetsPage() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useUser();
  const userDeptCode = (profile?.departments as any)?.code;
  const isDept1 = pathname.startsWith("/hr/dept1");
  const isDept2 = pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1 ? "/hr/dept1" : isDept2 ? "/hr/dept2" : "/hr/dept3";
  const [timesheets, setTimesheets] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [date, setDate] = useState<
    Date | undefined
  >(new Date());

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    setLoading(true);
    let query = supabase
      .schema("bpm-anec-global")
      .from("timesheet_management")
      .select(
        "*, profiles:employee_id(full_name, email)",
      );

    if (isDept1 || isDept2 || profile?.role === "employee" || profile?.role === "hr3_employee") {
      query = query.eq("employee_id", profile?.id);
    }

    const { data } = await query.order("week_starting", {
      ascending: false,
    });

    setTimesheets(data || []);
    setLoading(false);
  };

  const handleApprove = async (
    sheet: any
  ) => {
    const roleStr = profile?.role?.toLowerCase() || "";
    const isHR3Admin = roleStr === "hr3_admin" || (roleStr === "hr" && userDeptCode === "HR_DEPT3");

    if (!isHR3Admin) {
      return toast.error("Unauthorized");
    }

    toast.promise(
      approveTimesheet(
        sheet.id,
        sheet.employee_id,
        Number(sheet.total_hours) || 0,
        sheet.profiles?.email,
        sheet.profiles?.full_name,
        sheet.week_starting
      ),
      {
        loading: "Approving timesheet & forwarding to Payroll...",
        success: "Timesheet approved and sent to Finance",
        error: "Failed to approve timesheet",
      }
    );
    fetchTimesheets();
  };

  const filteredTimesheets = timesheets.filter(
    (t) =>
      t.profiles?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const totalTrackedHours = filteredTimesheets.reduce(
    (acc, t) => acc + (Number(t.total_hours) || 0),
    0,
  );
  const pendingAudits = filteredTimesheets.filter(
    (t) => t.status?.toLowerCase() !== "approved",
  ).length;

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
              Timesheet Lab
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Timesheet Lab
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Review & audit workforce operational
            cycles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Filter by personnel..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-indigo-500 font-medium text-xs"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-6 rounded-lg border-slate-200 font-bold bg-white text-slate-600 shadow-none transition-all hover:bg-slate-50 text-xs"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date
                  ? format(date, "PPP")
                  : "Select Week"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-lg border border-slate-200 shadow-2xl"
              align="end"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-4"
              />
            </PopoverContent>
          </Popover>
          <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3">
            <Download className="h-4 w-4" />{" "}
            Export Payroll Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Tracked Hours",
            value: formatDuration(totalTrackedHours),
            icon: Clock,
            sub: "Total active hours recorded",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Awaiting Audit",
            value: `${pendingAudits} Sheets`,
            icon: ClipboardList,
            sub: "Pending verification",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Projected Payout",
            value: `₱${(totalTrackedHours * 150).toLocaleString()}`,
            icon: FileCheck,
            sub: "Estimated based on hours",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            isCurrency: true,
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white group transition-all duration-500"
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div
                  className={
                    stat.bg +
                    " " +
                    stat.color +
                    " h-12 w-12 rounded-lg flex items-center justify-center font-black"
                  }
                >
                  <stat.icon className="h-7 w-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {stat.sub}
                </span>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                {stat.isCurrency ? (
                  <PrivacyMask
                    value={stat.value}
                  />
                ) : (
                  stat.value
                )}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Identity
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Cycle Range
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Net Hours
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Audit Status
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
                        colSpan={5}
                        className="h-24 px-8 py-6 bg-white"
                      />
                    </tr>
                  ))
                : filteredTimesheets.map(
                    (sheet) => (
                      <tr
                        key={sheet.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-black border border-slate-100 text-sm">
                              {sheet.profiles?.full_name?.charAt(
                                0,
                              ) || "U"}
                            </div>
                            <span className="font-black text-slate-900 tracking-tight">
                              <PrivacyMask
                                value={
                                  sheet.profiles
                                    ?.full_name ||
                                  "Unknown"
                                }
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 tracking-tight">
                              {sheet.week_starting
                                ? format(
                                    new Date(
                                      sheet.week_starting,
                                    ),
                                    "MMM d, yyyy",
                                  )
                                : "---"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                              Standard Cycle
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-900 tracking-tighter">
                            {formatDuration(Number(sheet.total_hours) || 0)}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                              sheet.status ===
                              "Approved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-amber-50 text-amber-600 animate-pulse border border-amber-100"
                            }`}
                          >
                            {sheet.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {sheet.status !==
                          "Approved" ? (
                            <Button
                              onClick={() =>
                                handleApprove(sheet)
                              }
                              className="h-9 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-none"
                            >
                              Approve
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-lg text-emerald-500 bg-emerald-50/50"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
            </tbody>
          </table>
          {filteredTimesheets.length === 0 &&
            !loading && (
              <div className="p-32 text-center">
                <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="h-6 w-6 text-slate-200" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-2 uppercase">
                  Waiting for Submissions
                </h3>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
