"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  FileText,
  Search,
  User,
  History,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface UserGroup {
  userId: string;
  fullName: string;
  totalActions: number;
  lastAction: string;
  lastDate: string;
  logs: AuditLog[];
}

const PAGE_SIZE = 10;

export default function AdminReportsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] =
    useState("all");
  const [allActions, setAllActions] = useState<
    string[]
  >([]);
  const [selectedUser, setSelectedUser] =
    useState<UserGroup | null>(null);
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    const { count } = await supabase
      .from("audit_logs")
      .select("id", {
        count: "exact",
        head: true,
      });
    setTotalCount(count || 0);

    const { data: actionData } = await supabase
      .from("audit_logs")
      .select("action");
    if (actionData)
      setAllActions([
        ...new Set(
          actionData.map((a) => a.action),
        ),
      ]);

    // Fetch ALL logs (for grouping by user), but with action filter
    let query = supabase
      .from("audit_logs")
      .select("*, profiles:user_id(full_name)")
      .order("created_at", { ascending: false });
    if (actionFilter !== "all")
      query = query.eq("action", actionFilter);
    const { data } = await query;
    setLogs((data || []) as AuditLog[]);
    setLoading(false);
  }, [supabase, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const channel = supabase
      .channel("audit-logs-rt")
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
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLogs]);

  const actionLabel = (action: string) =>
    action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const actionColor: Record<string, string> = {
    payout_approved: "bg-amber-50 text-amber-600",
    payout_disbursed:
      "bg-emerald-50 text-emerald-600",
    policy_created: "bg-blue-50 text-blue-600",
    policy_updated:
      "bg-purple-50 text-purple-600",
    subscription_plan_created:
      "bg-amber-50 text-amber-700",
    subscription_plan_updated:
      "bg-orange-50 text-orange-600",
    subscription_plan_deleted:
      "bg-red-50 text-red-600",
    category_created: "bg-teal-50 text-teal-600",
    category_updated: "bg-cyan-50 text-cyan-600",
    category_deleted: "bg-rose-50 text-rose-600",
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Group logs by user, newest change on top
  const userGroups: UserGroup[] = (() => {
    const map: Record<string, UserGroup> = {};
    const filtered = logs.filter((log) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        log.profiles?.full_name
          ?.toLowerCase()
          .includes(q) ||
        log.action.toLowerCase().includes(q) ||
        JSON.stringify(log.details)
          .toLowerCase()
          .includes(q)
      );
    });

    filtered.forEach((log) => {
      const uid = log.user_id;
      if (!map[uid]) {
        map[uid] = {
          userId: uid,
          fullName:
            log.profiles?.full_name || "Unknown",
          totalActions: 0,
          lastAction: log.action,
          lastDate: log.created_at,
          logs: [],
        };
      }
      map[uid].totalActions++;
      map[uid].logs.push(log);
      // Keep newest date
      if (
        new Date(log.created_at) >
        new Date(map[uid].lastDate)
      ) {
        map[uid].lastDate = log.created_at;
        map[uid].lastAction = log.action;
      }
    });

    // Sort by most recent activity first
    return Object.values(map).sort(
      (a, b) =>
        new Date(b.lastDate).getTime() -
        new Date(a.lastDate).getTime(),
    );
  })();

  // Paginate the grouped users
  const totalPages = Math.ceil(
    userGroups.length / PAGE_SIZE,
  );
  const pagedGroups = userGroups.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  // Unique users count
  const uniqueUsers = new Set(
    logs.map((l) => l.user_id),
  ).size;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/core/transaction3/admin">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Reports
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">
          Reports &amp; Admin
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Audit log — grouped by user
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-none rounded-lg p-5 bg-white">
          <FileText className="h-6 w-6 text-amber-500 mb-2" />
          <p className="text-[9px] font-black uppercase text-slate-400">
            Total Logs
          </p>
          <p className="text-2xl font-black text-slate-900">
            {totalCount}
          </p>
        </Card>
        <Card className="border border-slate-200 shadow-none rounded-lg p-5 bg-white">
          <User className="h-6 w-6 text-blue-500 mb-2" />
          <p className="text-[9px] font-black uppercase text-slate-400">
            Unique Users
          </p>
          <p className="text-2xl font-black text-slate-900">
            {uniqueUsers}
          </p>
        </Card>
        <Card className="border border-slate-200 shadow-none rounded-lg p-5 bg-white">
          <History className="h-6 w-6 text-emerald-500 mb-2" />
          <p className="text-[9px] font-black uppercase text-slate-400">
            Action Types
          </p>
          <p className="text-2xl font-black text-slate-900">
            {allActions.length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user, action, or details..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            className="pl-10 rounded-lg border-slate-200 h-10 font-bold text-sm shadow-none focus-visible:ring-slate-900"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={
              actionFilter === "all"
                ? "default"
                : "outline"
            }
            onClick={() => {
              setActionFilter("all");
              setPage(0);
            }}
            className={`rounded-lg h-10 font-black text-[10px] ${actionFilter === "all" ? "bg-slate-900 text-white" : "border-slate-200 text-black"}`}
          >
            All
          </Button>
          {allActions.map((action) => (
            <Button
              key={action}
              variant={
                actionFilter === action
                  ? "default"
                  : "outline"
              }
              onClick={() => {
                setActionFilter(action);
                setPage(0);
              }}
              className={`rounded-lg h-10 font-black text-[10px] ${actionFilter === action ? "bg-slate-900 text-white" : "border-slate-200 text-black"}`}
            >
              {actionLabel(action)}
            </Button>
          ))}
        </div>
      </div>

      {/* User-Grouped Log Table */}
      <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    User
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Last Activity
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Last Time
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse"
                    >
                      <td
                        colSpan={5}
                        className="p-6 bg-slate-50/20"
                      />
                    </tr>
                  ))
                ) : pagedGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center"
                    >
                      <LayoutDashboard className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        No logs found
                      </p>
                    </td>
                  </tr>
                ) : (
                  pagedGroups.map((g) => (
                    <tr
                      key={g.userId}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <User className="h-3 w-3 text-slate-500" />
                          </div>
                          <span className="font-black text-slate-900 text-xs">
                            {g.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-1 rounded-lg">
                          {g.totalActions} action
                          {g.totalActions > 1
                            ? "s"
                            : ""}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${actionColor[g.lastAction] || "bg-slate-100 text-slate-600"}`}
                        >
                          {actionLabel(
                            g.lastAction,
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-slate-500">
                        {fmtDate(g.lastDate)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            setSelectedUser(g)
                          }
                          className="bg-slate-900 hover:bg-black text-white font-black text-[9px] uppercase rounded-lg h-7 gap-1 px-3"
                        >
                          <Eye className="h-3 w-3" />{" "}
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Page {page + 1} of {totalPages} (
                {userGroups.length} users)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() =>
                    setPage((p) =>
                      Math.max(0, p - 1),
                    )
                  }
                  className="rounded-lg h-7 px-2 border-slate-200 font-black text-[10px] text-black"
                >
                  <ChevronLeft className="h-3 w-3 mr-0.5" />{" "}
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    page >= totalPages - 1
                  }
                  onClick={() =>
                    setPage((p) => p + 1)
                  }
                  className="rounded-lg h-7 px-2 border-slate-200 font-black text-[10px] text-black"
                >
                  Next{" "}
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) =>
          !open && setSelectedUser(null)
        }
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border border-slate-200 shadow-none p-0">
          <DialogHeader className="p-6 border-b border-slate-50 sticky top-0 bg-white z-10">
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              {selectedUser?.fullName || "User"} —
              Activity Log
            </DialogTitle>
          </DialogHeader>
          <div className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Date
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Action
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedUser?.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      {fmtDate(log.created_at)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${actionColor[log.action] || "bg-slate-100 text-slate-600"}`}
                      >
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                        {log.details
                          ?.shop_name && (
                          <p>
                            Shop:{" "}
                            {
                              log.details
                                .shop_name
                            }
                          </p>
                        )}
                        {log.details
                          ?.total_amount && (
                          <p>
                            Amount: ₱
                            {Number(
                              log.details
                                .total_amount,
                            ).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                          </p>
                        )}
                        {log.details
                          ?.reference_number && (
                          <p>
                            Ref:{" "}
                            {
                              log.details
                                .reference_number
                            }
                          </p>
                        )}
                        {log.details?.title && (
                          <p>
                            Title:{" "}
                            {log.details.title}
                          </p>
                        )}
                        {log.details?.type && (
                          <p>
                            Type:{" "}
                            {log.details.type}
                          </p>
                        )}
                        {log.details
                          ?.plan_type && (
                          <p>
                            Plan:{" "}
                            {
                              log.details
                                .plan_type
                            }
                          </p>
                        )}
                        {log.details
                          ?.commission_rate !==
                          undefined && (
                          <p>
                            Rate:{" "}
                            {
                              log.details
                                .commission_rate
                            }
                            %
                          </p>
                        )}
                        {log.details
                          ?.category_name && (
                          <p>
                            Category:{" "}
                            {
                              log.details
                                .category_name
                            }
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
