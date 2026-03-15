"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Search,
  Filter,
  MoreVertical,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Scan,
  Wifi,
  ShieldCheck,
  Smartphone,
  Fingerprint,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import { toast } from "sonner";
import { clockOutAction } from "@/app/actions/hr_attendance";
import { useUser } from "@/context/UserContext";
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

export default function AttendancePage() {
  const supabase = createClient();
  const router = useRouter();
  const { profile } = useUser();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const userDeptCode = (
    profile?.department as any
  )?.code;
  const isDept1 =
    pathname.startsWith("/hr/dept1");
  const isDept2 =
    pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1
    ? "/hr/dept1"
    : isDept2
      ? "/hr/dept2"
      : "/hr/dept3";
  const [searchQuery, setSearchQuery] =
    useState("");
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [isSimulating, setIsSimulating] =
    useState(false);
  const [simulationStep, setSimulationStep] =
    useState<
      "idle" | "rfid" | "biometric" | "success"
    >("idle");
  const [selectedEmpId, setSelectedEmpId] =
    useState<string>("");

  useEffect(() => {
    fetchLogs();
    fetchEmployees();

    const channel = supabase
      .channel("attendance_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "attendance",
        },
        fetchLogs,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("*")
      .not("role", "in", '("customer","seller")');
    setEmployees(data || []);
  };

  const fetchLogs = async () => {
    setLoading(true);
    const today = new Date()
      .toISOString()
      .split("T")[0];

    let query = supabase
      .schema("bpm-anec-global")
      .from("attendance")
      .select(
        "*, profiles!attendance_employee_id_fkey(full_name)",
      );

    if (isDept1 || isDept2) {
      query = query.eq(
        "employee_id",
        profile?.id,
      );
    } else {
      // For HR3, filter by today by default
      query = query.gte(
        "check_in",
        `${today}T00:00:00Z`,
      );
    }

    const { data } = await query.order(
      "check_in",
      { ascending: false },
    );

    if (data) {
      // Group by employee_id and take the latest one
      const latestLogsMap = new Map();
      data.forEach((log: any) => {
        if (!latestLogsMap.has(log.employee_id)) {
          latestLogsMap.set(log.employee_id, log);
        } else {
          // If we already have one, and this one is "Online Now" (no check_out), prioritize it
          const existing = latestLogsMap.get(
            log.employee_id,
          );
          if (
            !existing.check_out &&
            log.check_out
          ) {
            // Keep the active one
          } else if (
            existing.check_out &&
            !log.check_out
          ) {
            latestLogsMap.set(
              log.employee_id,
              log,
            );
          }
          // Otherwise keep the one already in (which is newer due to order)
        }
      });
      setLogs(Array.from(latestLogsMap.values()));
    } else {
      setLogs([]);
    }
    setLoading(false);
  };

  const handleAttendance = async () => {
    if (!selectedEmpId) return;

    setSimulationStep("rfid");
    await new Promise((r) => setTimeout(r, 1500));

    setSimulationStep("biometric");
    await new Promise((r) => setTimeout(r, 2000));

    const emp = employees.find(
      (e) => e.id === selectedEmpId,
    );
    const activeLog = logs.find(
      (l) =>
        l.employee_id === selectedEmpId &&
        !l.check_out,
    );

    if (activeLog) {
      const result = await clockOutAction(selectedEmpId, activeLog.id);

      if (!result.success)
        toast.error(result.error || "Failed to clock out");
      else
        toast.success(
          `Goodbye, ${emp?.full_name}!`,
        );
    } else {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("attendance")
        .insert({
          employee_id: selectedEmpId,
          check_in: new Date().toISOString(),
          status: "Live Now",
        });

      if (error)
        toast.error("Failed to clock in");
      else
        toast.success(
          `Welcome, ${emp?.full_name}!`,
        );
    }

    setSimulationStep("success");
    fetchLogs();
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationStep("idle");
      setSelectedEmpId("");
    }, 1500);
  };

  const filteredLogs = logs.filter((l) => {
    const name =
      l.profiles?.full_name || "Unknown";
    return name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

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
              Attendance Logs
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            Attendance Logs
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            OTP Verification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              placeholder="Search employee logs..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-blue-500 font-medium text-xs"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
          <Button
            variant="outline"
            className="h-10 w-10 rounded-lg bg-white border-slate-200 text-slate-400 p-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-10 w-10 rounded-lg bg-white border-slate-200 text-slate-400 p-0"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Dialog
            open={isSimulating}
            onOpenChange={setIsSimulating}
          ></Dialog>

          <Button
            variant="outline"
            className="rounded-lg border-slate-200 h-10 px-6 font-black text-[10px] uppercase tracking-widest bg-white"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Employee Profile
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Check In Time
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Check Out Time
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Status
                </th>
                <th className="px-8 py-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="animate-pulse"
                  >
                    <td
                      colSpan={5}
                      className="h-24 px-8 py-6 bg-white"
                    />
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-32 text-center bg-white"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Users className="h-6 w-6 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-slate-900 uppercase">
                          No logs found
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Try adjusting your
                          filters
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100">
                          {log.profiles?.full_name?.charAt(
                            0,
                          ) || "U"}
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-slate-900 block">
                            <PrivacyMask
                              value={
                                log.profiles
                                  ?.full_name ||
                                "Unknown"
                              }
                            />
                          </span>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">
                              Integrated Office HQ
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-700">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-black text-slate-900">
                            {log.check_in
                              ? new Date(
                                  log.check_in,
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute:
                                      "2-digit",
                                    second:
                                      "2-digit",
                                  },
                                )
                              : "---"}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-4">
                          {log.check_in
                            ? new Date(
                                log.check_in,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-700">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`h-2 w-2 rounded-full ${log.check_out ? "bg-blue-500" : "bg-slate-200"}`}
                          />
                          <span className="font-black text-slate-900">
                            {log.check_out
                              ? new Date(
                                  log.check_out,
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute:
                                      "2-digit",
                                    second:
                                      "2-digit",
                                  },
                                )
                              : `Online Now (${Math.floor((new Date().getTime() - new Date(log.check_in).getTime()) / (1000 * 60 * 60))}h ${Math.floor(((new Date().getTime() - new Date(log.check_in).getTime()) / (1000 * 60)) % 60)}m)`}
                          </span>
                        </div>
                        {log.check_out && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase ml-4">
                            {new Date(
                              log.check_out,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          log.check_out
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-600 animate-pulse"
                        }`}
                      >
                        {log.check_out
                          ? "Clocked Out"
                          : "Online Now"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
