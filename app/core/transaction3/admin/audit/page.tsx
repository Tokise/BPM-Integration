"use client";

import { useState, useEffect } from "react";
import {
  History,
  Search,
  ArrowLeft,
  Calendar,
  Filter,
  User,
  Activity,
  ChevronRight,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Core3AuditPage() {
  const supabase = createClient();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();

    const auditSync = supabase
      .channel("core3_audit_sync")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "bpm-anec-global",
          table: "audit_logs",
        },
        () => fetchLogs(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(auditSync);
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("audit_logs")
      .select("*, profiles:user_id(full_name)")
      .order("created_at", { ascending: false });

    if (data) setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      log.profiles?.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      JSON.stringify(log.details)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const getActionColor = (action: string) => {
    if (action.includes("create"))
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (action.includes("delete"))
      return "bg-red-50 text-red-600 border-red-100";
    if (action.includes("archive"))
      return "bg-amber-50 text-amber-600 border-amber-100";
    if (action.includes("update"))
      return "bg-blue-50 text-blue-600 border-blue-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  "/core/transaction3/admin",
                )
              }
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-[10px] font-black text-slate-400 capitalize tracking-widest">
              Core3 / Admin / Audit
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">
            System Audit
          </h1>
          <p className="font-bold text-slate-500 uppercase text-xs tracking-[0.3em]">
            Transparent Transaction Logging
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchLogs}
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-2xl h-14 px-8 hover:bg-slate-50"
          >
            <Activity className="mr-2 h-5 w-5" />{" "}
            Refresh Logs
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[40px] bg-white overflow-hidden">
        <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-indigo-500" />
              Activity Ledger
            </CardTitle>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Full history of HR and
              organizational changes
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input
              placeholder="Search actions or users..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
            <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest animate-pulse">
              Retrieving secure logs...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none">
                  <TableHead className="py-6 px-10 text-black font-black uppercase text-[10px] tracking-widest">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-black font-black uppercase text-[10px] tracking-widest">
                    Actor
                  </TableHead>
                  <TableHead className="text-black font-black uppercase text-[10px] tracking-widest">
                    Action
                  </TableHead>
                  <TableHead className="text-black font-black uppercase text-[10px] tracking-widest">
                    Details
                  </TableHead>
                  <TableHead className="text-right px-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-slate-50 hover:bg-slate-50/30 transition-colors"
                  >
                    <TableCell className="py-6 px-10">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-300" />
                        <span className="font-bold text-slate-600 text-sm">
                          {new Date(
                            log.created_at,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="font-black text-slate-900">
                          {log.profiles
                            ?.full_name ||
                            "System"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}
                      >
                        {log.action.replace(
                          /_/g,
                          " ",
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium text-slate-500 text-sm">
                      {typeof log.details ===
                      "string"
                        ? log.details
                        : JSON.stringify(
                            log.details,
                          )}
                    </TableCell>
                    <TableCell className="text-right px-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl group"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-20 text-center text-slate-400 font-bold"
                    >
                      No audit records matching
                      your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
