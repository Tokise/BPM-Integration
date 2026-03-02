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
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
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

export default function AttendancePage() {
  const supabase = createClient();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");

  useEffect(() => {
    fetchLogs();

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

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("attendance")
      .select("*")
      .order("check_in", { ascending: false });

    setLogs(data || []);
    setLoading(false);
  };

  const filteredLogs = logs.filter((l) =>
    l.employee_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() =>
                router.push("/hr/dept3")
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Attendance Logs
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Real-time clock-in/out and biometric
              synchronization
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-xl border-slate-200 h-11 px-6 font-black text-[10px] uppercase tracking-widest"
          >
            Export Report (CSV)
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              placeholder="Search employee names..."
              className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-blue-500 font-medium"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
          <Button
            variant="ghost"
            className="h-12 w-12 rounded-2xl bg-white shadow-xl shadow-slate-100/50 text-slate-400"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-100/50 overflow-hidden border border-slate-50 text-slate-600">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Employee
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Check In
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Check Out
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Location
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
                        className="h-20 px-8 py-6 bg-white/50"
                      />
                    </tr>
                  ))
                : filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            {log.employee_name?.charAt(
                              0,
                            )}
                          </div>
                          <span className="font-bold text-slate-900">
                            {log.employee_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-emerald-500" />
                          <span className="font-bold text-slate-700">
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {log.check_in
                            ? new Date(
                                log.check_in,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-blue-400" />
                          <span className="font-bold text-slate-700">
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
                              : "Still Active"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs font-bold uppercase tracking-tight">
                            Main Office
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            log.check_out
                              ? "bg-slate-50 text-slate-500"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {log.check_out
                            ? "Clocked Out"
                            : "Live Now"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 &&
            !loading && (
              <div className="p-20 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  No Records Found
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Adjust your search or filter
                  settings
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
