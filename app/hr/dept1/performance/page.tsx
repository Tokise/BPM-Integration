"use client";

import { useEffect, useState } from "react";
import {
  Star,
  Search,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Award,
  Calendar,
  Trophy,
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
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  submitApplicantEvaluation,
  startEvaluationPeriod,
  endEvaluationPeriod,
  getPerformanceLeaderboard,
} from "@/app/actions/hr";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/UserContext";

export default function EmployeePerformancePage({
  backUrl = "/hr/dept1",
  title = "HR1 - Candidate Performance",
}: {
  backUrl?: string;
  title?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { profile } = useUser();
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [evaluations, setEvaluations] = useState<
    Record<string, any>
  >({});
  const [selectedResult, setSelectedResult] =
    useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEvalOpen, setIsEvalOpen] = useState<
    boolean | null
  >(null);
  const [currentPage, setCurrentPage] =
    useState(1);
  const [showCompleted, setShowCompleted] =
    useState(false);
  const [leaderboard, setLeaderboard] = useState<
    any[]
  >([]);
  const [roleFilter, setRoleFilter] =
    useState("all");
  const itemsPerPage = 2;

  const isMasterHr =
    profile?.role === "admin" ||
    profile?.department_id ===
      "d1f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7a" ||
    (profile?.departments as any)?.code ===
      "HR_DEPT1";

  // Control should only be visible on the main HR performance page, not on dept-specific ones like Logistics/Finance
  const canManipulateEval =
    isMasterHr &&
    (title === "Candidate Performance" ||
      title === "Admin Performance Management");

  useEffect(() => {
    if (profile) fetchEmployees();
  }, [profile]);

  const fetchEmployees = async () => {
    setLoading(true);
    let query = supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select(
        `id, full_name, role, department_id, is_evaluated, updated_at, 
         performance_results:performance_results!performance_results_employee_id_fkey(tech_score, comm_score, ps_score, eng_score, avg_score, comments)`,
      )
      .in("role", ["hr", "logistics", "finance"])
      .order("updated_at", { ascending: false });

    // Role-based visibility logic: HR Dept 1 sees all.
    // Others only see employees inside their dept.
    if (!isMasterHr) {
      if (profile?.department_id) {
        query = query.eq(
          "department_id",
          profile.department_id,
        );
      }
    }

    // Check existing evaluation period deadline
    const { data: latestOpen } = await supabase
      .schema("bpm-anec-global")
      .from("notifications")
      .select("created_at")
      .eq("title", "Performance Evaluation Open")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: latestClose } = await supabase
      .schema("bpm-anec-global")
      .from("notifications")
      .select("created_at")
      .eq(
        "title",
        "Performance Evaluation Closed",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let currentlyOpen = false;
    if (latestOpen) {
      const openDate = new Date(
        latestOpen.created_at,
      );
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(
        sevenDaysAgo.getDate() - 7,
      );

      // It's open if it started within 7 days AND there's no more recent "Closed" notification
      if (openDate >= sevenDaysAgo) {
        currentlyOpen = true;
        if (
          latestClose &&
          new Date(latestClose.created_at) >
            openDate
        ) {
          currentlyOpen = false;
        }
      }
    }
    setIsEvalOpen(currentlyOpen);

    const { data, error } = await query;
    if (error) {
      if (error.message.includes("tech_score")) {
        toast.error(
          "Database mismatch detected. Please run the Quick Fix SQL from the brain folder.",
          {
            duration: 5000,
          },
        );
      }
      console.error(
        "Error fetching employees:",
        error,
      );
      toast.error("Failed to load employees");
    }
    if (data) setEmployees(data);
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    try {
      const res =
        await getPerformanceLeaderboard();
      if (res.success && res.data) {
        // Use raw avg_score directly as requested, ensuring it's the same as evaluation score
        const mappedData = res.data.map(
          (item: any) => ({
            ...item,
            points: Number(
              item.avg_score || 0,
            ).toFixed(1),
            label: "Eval Score",
          }),
        );
        setLeaderboard(mappedData);
      } else {
        throw new Error(
          res.error ||
            "Failed to fetch leaderboard",
        );
      }
    } catch (error) {
      console.error(
        "Error fetching leaderboard:",
        error,
      );
    }
  };

  useEffect(() => {
    if (isEvalOpen === false) fetchLeaderboard();
  }, [isEvalOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showCompleted]);

  const handleSubmitEvaluation = async (
    e: any,
  ) => {
    const scores = evaluations[e.id];
    if (
      !scores ||
      !scores.tech ||
      !scores.comm ||
      !scores.ps ||
      !scores.eng
    )
      return;

    const toastId = toast.loading(
      "Saving evaluation...",
    );
    const avgScore =
      (scores.tech +
        scores.comm +
        scores.ps +
        scores.eng) /
      4;
    const remark =
      avgScore >= 4
        ? "Excellent"
        : avgScore >= 3
          ? "Good"
          : "Needs Improvement";

    try {
      const res = await submitApplicantEvaluation(
        e.id,
        e.full_name || "Unnamed",
        profile?.id || "system-evaluator",
        remark,
        scores,
      );

      if (res.success) {
        toast.success(
          `Evaluation recorded for ${e.full_name || "Unnamed"}`,
          { id: toastId },
        );
        // Brief delay to ensure DB triggers/indices are updated before refresh
        setTimeout(async () => {
          await fetchEmployees();
          setShowCompleted(true);
        }, 300);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to save evaluation",
        { id: toastId },
      );
    }
  };

  const filtered = employees.filter((e) => {
    const isSelf = e.id === profile?.id;
    const matchesSearch = (e.full_name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCompletion = showCompleted
      ? e.is_evaluated
      : !e.is_evaluated;
    const matchesRole =
      roleFilter === "all" ||
      e.role === roleFilter;

    return (
      !isSelf &&
      matchesSearch &&
      matchesCompletion &&
      matchesRole
    );
  });

  const paginatedCandidates = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(
    filtered.length / itemsPerPage,
  );

  const handleStartPeriod = async () => {
    const toastId = toast.loading(
      "Broadcasting new evaluation period...",
    );
    try {
      const res = await startEvaluationPeriod();
      if (res.success) {
        toast.success(
          "1-Week Evaluation Period started. Notifications sent.",
          { id: toastId },
        );
        setIsEvalOpen(true);
        // Refresh employee list immediately to clear "Done" statuses
        await fetchEmployees();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast.error(
        e.message || "Failed to start period",
        { id: toastId },
      );
    }
  };

  const handleEndPeriod = async () => {
    const toastId = toast.loading(
      "Ending current evaluation period...",
    );
    try {
      const res = await endEvaluationPeriod();
      if (res.success) {
        toast.success(
          "Evaluation period manually closed.",
          { id: toastId },
        );
        setIsEvalOpen(false);
        // Refresh employee list to update status
        await fetchEmployees();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast.error(
        e.message || "Failed to end period",
        { id: toastId },
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link
                href={
                  profile?.departments?.code ===
                  "HR_DEPT2"
                    ? "/hr/dept2"
                    : profile?.departments
                          ?.code === "HR_DEPT3"
                      ? "/hr/dept3"
                      : profile?.departments
                            ?.code === "HR_DEPT4"
                        ? "/hr/dept4"
                        : profile?.departments
                              ?.code ===
                            "LOG_DEPT1"
                          ? "/logistic/dept1"
                          : profile?.departments
                                ?.code ===
                              "LOG_DEPT2"
                            ? "/logistic/dept2"
                            : profile?.departments
                                  ?.code ===
                                "FINANCE"
                              ? "/finance"
                              : profile?.role ===
                                  "admin"
                                ? "/core/transaction3/admin"
                                : profile?.role ===
                                    "seller"
                                  ? "/core/transaction2/seller"
                                  : backUrl
                }
              >
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              {title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            {title}
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Evaluate and track talent during
            screening
          </p>
        </div>
        {isMasterHr && isEvalOpen && (
          <Button
            onClick={handleEndPeriod}
            variant="destructive"
            className="rounded-xl h-11 px-6 font-black bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-sm flex items-center gap-2"
          >
            <Zap className="h-4 w-4 fill-red-600" />
            End Evaluation
          </Button>
        )}
      </div>

      <div
        className={`grid gap-6 ${isEvalOpen ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 max-w-4xl mx-auto w-full"}`}
      >
        <div
          className={`${isEvalOpen ? "lg:col-span-2" : ""} space-y-6`}
        >
          {isEvalOpen && (
            <div className="flex flex-col md:flex-row items-center justify-end gap-3 mb-6">
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-full md:w-[280px] h-10 bg-transparent border-slate-200 rounded-lg font-bold text-xs text-slate-600">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    All Roles
                  </SelectItem>
                  {Array.from(
                    new Set(
                      employees.map(
                        (e) => e.role,
                      ),
                    ),
                  )
                    .filter(Boolean)
                    .map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="font-bold text-xs uppercase tracking-widest p-3"
                      >
                        {role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="relative group w-full md:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  placeholder="Search candidates..."
                  className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-lg focus-visible:ring-indigo-500 font-medium text-sm"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              <Button
                onClick={() =>
                  setShowCompleted(!showCompleted)
                }
                variant={
                  showCompleted
                    ? "outline"
                    : "default"
                }
                className={`h-10 rounded-xl px-4 font-black shadow-sm transition-all text-[10px] uppercase tracking-[0.1em] ${
                  showCompleted
                    ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {showCompleted
                  ? "Pending Tasks"
                  : "Completed Eval"}
              </Button>
            </div>
          )}

          {isEvalOpen === false && (
            <div className="space-y-6">
              {title ===
                "Candidate Performance" && (
                <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
                  <CardContent className="p-10">
                    <div className="flex flex-col items-center text-center mb-10">
                      <div className="h-20 w-20 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-500 mb-6 shadow-inner ring-4 ring-amber-50/50">
                        <Trophy className="h-10 w-10 animate-bounce" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                        Performance Leaderboard
                      </h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Season Top Performers
                      </p>
                    </div>

                    <div className="space-y-4">
                      {leaderboard.length > 0 ? (
                        leaderboard.map(
                          (entry, idx) => (
                            <div
                              key={entry.id}
                              className="group flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100"
                            >
                              <div
                                className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                                  idx === 0
                                    ? "bg-amber-500 text-white rotate-3"
                                    : idx === 1
                                      ? "bg-slate-300 text-slate-700 -rotate-3"
                                      : idx === 2
                                        ? "bg-orange-300 text-white"
                                        : "bg-white text-slate-400"
                                }`}
                              >
                                #{idx + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-black text-slate-900 leading-none mb-1">
                                  <PrivacyMask
                                    value={
                                      entry
                                        .receiver
                                        ?.full_name ||
                                      "Employee"
                                    }
                                  />
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {entry.receiver
                                    ?.role ||
                                    "Staff"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-black text-indigo-600 leading-none">
                                  {entry.points}
                                </div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                  {entry.label ||
                                    "Eval Score"}
                                </div>
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="py-20 text-center">
                          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">
                            Calculating Final
                            Results...
                          </p>
                        </div>
                      )}
                    </div>

                    {isMasterHr && (
                      <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                          Ready for the next
                          cycle?
                        </p>
                        <Button
                          onClick={
                            handleStartPeriod
                          }
                          className="rounded-xl h-14 px-10 font-black bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all hover:-translate-y-1 active:translate-y-0"
                        >
                          Start New Evaluation
                          Period
                          <Zap className="h-4 w-4 ml-2 fill-amber-400 text-amber-400" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border shadow-sm rounded-xl p-8 text-center bg-slate-50/30 border border-slate-100">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Calendar className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Evaluation period has ended.
                    It will update again soon.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {isEvalOpen ? (
            <div className="grid gap-4">
              {loading || isEvalOpen === null ? (
                <Card className="border shadow-sm rounded-xl p-20 text-center animate-pulse font-black text-slate-300">
                  Loading Evaluations Dashboard...
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="border shadow-sm rounded-xl p-20 text-center flex flex-col items-center gap-4 bg-white">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Search className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {showCompleted
                        ? "No completed evaluations"
                        : "No candidates found"}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 max-w-sm mx-auto uppercase tracking-widest">
                      {search
                        ? `No matches for "${search}"`
                        : showCompleted
                          ? "Evaluated employees will appear here"
                          : "No candidates in evaluation phase"}
                    </p>
                    <Button
                      onClick={fetchEmployees}
                      variant="ghost"
                      className="mt-6 text-indigo-600 font-black hover:bg-indigo-50 rounded-xl"
                    >
                      Refresh List
                    </Button>
                  </div>
                </Card>
              ) : showCompleted ? (
                <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-50">
                          <TableHead className="text-left py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Employee
                          </TableHead>
                          <TableHead className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Culture Match
                          </TableHead>
                          <TableHead className="text-right py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCandidates.map(
                          (e) => (
                            <TableRow
                              key={e.id}
                              className="group hover:bg-slate-50/50 transition-colors"
                            >
                              <TableCell className="py-5 px-10">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                    {
                                      (e.full_name ||
                                        "?")[0]
                                    }
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-900 leading-none mb-1">
                                      <PrivacyMask
                                        value={
                                          e.full_name
                                        }
                                      />
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {e.role}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex gap-0.5">
                                    {[
                                      1, 2, 3, 4,
                                      5,
                                    ].map((i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i <=
                                          Math.round(
                                            Number(
                                              e
                                                .performance_results?.[0]
                                                ?.avg_score ||
                                                e.avg_score ||
                                                0,
                                            ),
                                          )
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-slate-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-black text-slate-900">
                                    {Number(
                                      e
                                        .performance_results?.[0]
                                        ?.avg_score ||
                                        e.avg_score ||
                                        0,
                                    ).toFixed(1)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-10 text-right">
                                <Button
                                  onClick={() => {
                                    setSelectedResult(
                                      e
                                        .performance_results?.[0],
                                    );
                                    setIsDetailOpen(
                                      true,
                                    );
                                  }}
                                  variant="ghost"
                                  className="h-9 px-4 rounded-xl text-indigo-600 font-black hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  View Score
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              ) : (
                paginatedCandidates.map((e) => (
                  <Card
                    key={e.id}
                    className="border shadow-sm rounded-xl overflow-hidden bg-white hover:ring-2 hover:ring-indigo-100 transition-all"
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black uppercase">
                            {(e.full_name || "?")
                              .split(" ")
                              .map(
                                (w: string) =>
                                  w[0],
                              )
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 leading-none mb-1">
                              <PrivacyMask
                                value={
                                  e.full_name ||
                                  "Unnamed"
                                }
                              />
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                {e.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 py-6 border-y border-slate-50">
                        {[
                          {
                            id: "tech",
                            label:
                              "Technical Skill",
                            color: "blue",
                          },
                          {
                            id: "comm",
                            label:
                              "Communication",
                            color: "indigo",
                          },
                          {
                            id: "ps",
                            label:
                              "Problem Solving",
                            color: "purple",
                          },
                          {
                            id: "eng",
                            label: "Engagement",
                            color: "emerald",
                          },
                        ].map((skill) => (
                          <div
                            key={skill.id}
                            className="flex items-center justify-between"
                          >
                            <label className="text-[10px] w-32 font-black text-slate-400 uppercase tracking-widest">
                              {skill.label}
                            </label>
                            <div className="flex flex-wrap gap-2.5 flex-1 pl-4">
                              {[
                                1, 2, 3, 4, 5,
                              ].map((i) => {
                                const isSelected =
                                  evaluations[
                                    e.id
                                  ]?.[
                                    skill.id
                                  ] === i;
                                return (
                                  <label
                                    key={i}
                                    className="flex items-center gap-1 group cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name={`${skill.id}-${e.id}`}
                                      value={i}
                                      checked={
                                        isSelected
                                      }
                                      onChange={() =>
                                        setEvaluations(
                                          (
                                            prev,
                                          ) => ({
                                            ...prev,
                                            [e.id]:
                                              {
                                                ...prev[
                                                  e
                                                    .id
                                                ],
                                                [skill.id]:
                                                  i,
                                              },
                                          }),
                                        )
                                      }
                                      className={`w-3.5 h-3.5 accent-${skill.color}-600`}
                                    />
                                    <span
                                      className={`text-[10px] font-bold ${
                                        isSelected
                                          ? `text-${skill.color}-700`
                                          : "text-slate-400 group-hover:text-slate-700"
                                      }`}
                                    >
                                      {i}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400">
                          Please evaluate all 4
                          competencies.
                        </p>
                        <Button
                          onClick={() =>
                            handleSubmitEvaluation(
                              e,
                            )
                          }
                          disabled={
                            !evaluations[e.id]
                              ?.tech ||
                            !evaluations[e.id]
                              ?.comm ||
                            !evaluations[e.id]
                              ?.ps ||
                            !evaluations[e.id]
                              ?.eng
                          }
                          className="rounded-xl h-10 px-6 font-black bg-slate-900 text-white hover:bg-slate-800"
                        >
                          Submit Evaluation
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Pagination Controls */}
              {totalPages > 1 &&
                (isEvalOpen ||
                  profile?.department_id ===
                    "d1f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7a" ||
                  (profile?.departments as any)
                    ?.code === "HR_DEPT1" ||
                  (Array.isArray(
                    profile?.departments,
                  ) &&
                    (
                      profile?.departments as any
                    ).some(
                      (d: any) =>
                        d.code === "HR_DEPT1",
                    ))) &&
                !loading &&
                filtered.length > 0 && (
                  <div className="flex items-center justify-between px-4 mt-2">
                    <Button
                      variant="ghost"
                      className="text-xs font-bold"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.max(1, prev - 1),
                        )
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Page {currentPage} of{" "}
                      {totalPages}
                    </div>
                    <Button
                      variant="ghost"
                      className="text-xs font-bold"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            totalPages,
                            prev + 1,
                          ),
                        )
                      }
                      disabled={
                        currentPage === totalPages
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
            </div>
          ) : (
            <div /> // Strictly hidden when closed
          )}
        </div>

        {isEvalOpen && (
          <div className="space-y-6">
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center py-10">
                <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-none">
                  Growth Insights
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">
                  Evaluation Trend
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-colors">
                    <span className="text-xs font-bold text-slate-500">
                      Avg Proficiency
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      4.2/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-colors">
                    <span className="text-xs font-bold text-slate-500">
                      Participation
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      89%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      >
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[32px] bg-slate-50">
          <div className="bg-white p-8 pb-6 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Award className="h-6 w-6 text-indigo-600" />
                Evaluation Details
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Comprehensive Assessment
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i <=
                      Math.round(
                        Number(
                          selectedResult?.avg_score ||
                            0,
                        ),
                      )
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {[
              {
                label: "Technical Skill",
                val:
                  selectedResult?.tech_score ??
                  selectedResult?.tech,
                color: "blue",
              },
              {
                label: "Communication",
                val:
                  selectedResult?.comm_score ??
                  selectedResult?.comm,
                color: "indigo",
              },
              {
                label: "Problem Solving",
                val:
                  selectedResult?.ps_score ??
                  selectedResult?.ps,
                color: "purple",
              },
              {
                label: "Engagement",
                val:
                  selectedResult?.eng_score ??
                  selectedResult?.eng,
                color: "emerald",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="space-y-2"
              >
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>{item.label}</span>
                  <span
                    className={`text-${item.color}-600`}
                  >
                    {item.val}/5
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${item.color}-500 transition-all duration-1000`}
                    style={{
                      width: `${(item.val || 0) * 20}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {selectedResult?.comments && (
              <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                  Feedback Summary
                </p>
                <p className="text-sm font-medium text-slate-700 italic">
                  "{selectedResult.comments}"
                </p>
              </div>
            )}
          </div>

          <div className="p-8 pt-0">
            <Button
              onClick={() =>
                setIsDetailOpen(false)
              }
              className="w-full h-12 rounded-2xl font-black bg-slate-900 text-white hover:bg-slate-800"
            >
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
