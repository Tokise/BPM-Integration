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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("attendance")
      .select(
        "*, profiles!attendance_employee_id_fkey(full_name)",
      )
      .order("check_in", { ascending: false });

    setLogs(data || []);
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
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("attendance")
        .update({
          check_out: new Date().toISOString(),
          status: "Clocked Out",
        })
        .eq("id", activeLog.id);

      if (error)
        toast.error("Failed to clock out");
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
              <Link href="/hr/dept3">
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
            RFID & Biometric Synchronization
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
          >
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-slate-900 hover:bg-black h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-none flex items-center gap-3">
                <Wifi className="h-4 w-4" />{" "}
                Simulate RFID Tap
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden max-w-md bg-white">
              <div className="p-10 space-y-6">
                <div className="space-y-2 text-center">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    RFID Scan
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Multi-layer Identity
                    Verification
                  </p>
                </div>

                {simulationStep === "idle" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Select Employee Card
                      </label>
                      <Select
                        value={selectedEmpId}
                        onValueChange={
                          setSelectedEmpId
                        }
                      >
                        <SelectTrigger className="h-12 rounded-lg border-slate-200 bg-slate-50 font-bold text-slate-900 px-4">
                          <SelectValue placeholder="Tap RFID Card..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-slate-200 shadow-xl p-2 max-h-[300px]">
                          {employees.map(
                            (emp) => (
                              <SelectItem
                                key={emp.id}
                                value={emp.id}
                                className="rounded-lg font-bold py-2 px-3 hover:bg-slate-50 transition-colors"
                              >
                                <PrivacyMask
                                  value={
                                    emp.full_name
                                  }
                                />
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      disabled={!selectedEmpId}
                      onClick={handleAttendance}
                      className="w-full h-12 rounded-lg bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-none"
                    >
                      Initiate Security Scan
                    </Button>
                  </div>
                )}

                {(simulationStep === "rfid" ||
                  simulationStep ===
                    "biometric") && (
                  <div className="flex flex-col items-center py-10 space-y-8">
                    <div className="relative">
                      <div className="h-24 w-24 border-2 border-slate-100 rounded-full flex items-center justify-center bg-slate-50 animate-pulse">
                        {simulationStep ===
                        "rfid" ? (
                          <Wifi className="h-10 w-10 text-blue-500" />
                        ) : (
                          <Scan className="h-10 w-10 text-blue-600" />
                        )}
                      </div>
                      <div className="absolute top-0 right-0 h-6 w-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="space-y-3 text-center">
                      <p className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs">
                        {simulationStep === "rfid"
                          ? "Reading Chip..."
                          : "Scanning Face..."}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                        <span className="text-[10px] font-bold text-slate-400">
                          Verifying Geofence...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {simulationStep === "success" && (
                  <div className="flex flex-col items-center py-10 space-y-6">
                    <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        Access Granted
                      </h3>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Log Synced Successfully
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
                                  },
                                )
                              : "Still Working"}
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
