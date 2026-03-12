"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  UserCheck,
  Rocket,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Send,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Users,
  ClipboardCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import {
  onboardEmployee,
  updateApplicantStatus,
} from "@/app/actions/hr";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function OnboardingPage() {
  const supabase = createClient();

  // Data for Selects
  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Tab Data
  const [hiredApplicants, setHiredApplicants] =
    useState<any[]>([]);
  const [
    onboardingHistory,
    setOnboardingHistory,
  ] = useState<any[]>([]);
  const [recentOnboards, setRecentOnboards] =
    useState<any[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState<string | null>(null);
  const [assignments, setAssignments] = useState<
    Record<
      string,
      { roleId: string; departmentId: string }
    >
  >({});

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch valid employee roles
    const { data: rolesData } = await supabase
      .schema("bpm-anec-global")
      .from("roles")
      .select("*")
      .order("name");

    const allRoles = rolesData || [];
    const filteredRoles = allRoles.filter(
      (r: any) =>
        !["customer", "seller"].includes(
          r.name?.toLowerCase(),
        ),
    );
    const employeeRoleIds = filteredRoles.map(
      (r: any) => r.id,
    );
    setRoles(filteredRoles);

    // 2. Fetch departments, history, and recent onboards
    const [
      deptRes,
      onboardsRes,
      hiredRes,
      historyRes,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("departments")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select(
          "id, full_name, email, role, role_id, updated_at, departments!profiles_department_id_fkey (name), roles (name)",
        )
        .in("role_id", employeeRoleIds)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .select("*")
        .eq("status", "hired")
        .order("created_at", {
          ascending: false,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .select(
          "*, roles!assigned_role_id(name), departments!assigned_department_id(name)",
        )
        .in("status", [
          "awaiting_hcm",
          "onboarded",
        ])
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    if (deptRes.data)
      setDepartments(deptRes.data);
    if (onboardsRes.data)
      setRecentOnboards(onboardsRes.data);
    if (hiredRes.data) {
      setHiredApplicants(hiredRes.data);
      // Initialize assignments
      const initial: any = {};
      hiredRes.data.forEach((app: any) => {
        if (!assignments[app.id]) {
          initial[app.id] = {
            roleId: "",
            departmentId: "",
          };
        }
      });
      setAssignments((prev) => ({
        ...initial,
        ...prev,
      }));
    }
    if (historyRes.data)
      setOnboardingHistory(historyRes.data);

    setLoading(false);
  }, [supabase, assignments]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignmentChange = (
    appId: string,
    field: "roleId" | "departmentId",
    value: string,
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        [field]: value,
      },
    }));
  };

  const handleForwardToHCM = async (
    applicant: any,
  ) => {
    const assignment = assignments[applicant.id];
    if (
      !assignment?.roleId ||
      !assignment?.departmentId
    ) {
      toast.error(
        "Please assign both a role and department first",
      );
      return;
    }

    setProcessingId(applicant.id);
    const toastId = toast.loading(
      "Forwarding to HCM Central...",
    );

    try {
      const res = await updateApplicantStatus(
        applicant.id,
        "awaiting_hcm",
        applicant.email,
        `${applicant.first_name} ${applicant.last_name}`,
        undefined,
        undefined,
        undefined,
        assignment.roleId,
        assignment.departmentId,
      );

      if (!res.success)
        throw new Error(res.error);

      toast.success(
        "Hired applicant forwarded to HCM!",
        { id: toastId },
      );
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to forward applicant",
        { id: toastId },
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/hr/dept1">
                  Dept 1: Recruitment
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                Onboarding Hub
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Onboarding Hub
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 pl-1">
              Employee Integration & System
              Activation
            </p>
          </div>

          <div className="relative group w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
            <Input
              placeholder="Search history..."
              className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-xl focus-visible:ring-amber-500 font-medium text-sm"
            />
          </div>
        </div>

        <Tabs
          defaultValue="integration"
          className="w-full space-y-10"
        >
          <TabsList className="bg-slate-100/50 p-1 rounded-xl h-auto w-fit flex gap-1">
            <TabsTrigger
              value="integration"
              className="rounded-lg px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-400 transition-all duration-300"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Active Integration
              {hiredApplicants.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center text-[10px]">
                  {hiredApplicants.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-400 transition-all duration-300"
            >
              <History className="h-4 w-4 mr-2" />
              Process History
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="rounded-lg px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-400 transition-all duration-300"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Recent Hires
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="integration"
            className="animate-in fade-in slide-in-from-left-4 duration-500"
          >
            <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
              <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-emerald-500" />
                  Integration Queue
                </CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Assign roles and departments to
                  hired applicants
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="py-6 px-10 font-black uppercase text-[10px] tracking-widest text-slate-500">
                        Applicant
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                        Role Assignment
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                        Department
                      </TableHead>
                      <TableHead className="text-right px-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-20 text-center opacity-30 text-xs font-black uppercase tracking-widest animate-pulse"
                        >
                          Syncing Integration
                          Data...
                        </TableCell>
                      </TableRow>
                    ) : hiredApplicants.length ===
                      0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-32 text-center"
                        >
                          <div className="flex flex-col items-center gap-3 opacity-30">
                            <ClipboardCheck className="h-16 w-16 text-slate-200" />
                            <p className="font-black uppercase text-xs tracking-widest">
                              Integration Queue
                              Empty
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      hiredApplicants.map(
                        (app) => (
                          <TableRow
                            key={app.id}
                            className="border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <TableCell className="py-8 px-10">
                              <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                  <UserIcon className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-base">
                                    {
                                      app.first_name
                                    }{" "}
                                    {
                                      app.last_name
                                    }
                                  </p>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                    {app.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={
                                  assignments[
                                    app.id
                                  ]?.roleId
                                }
                                onValueChange={(
                                  val,
                                ) =>
                                  handleAssignmentChange(
                                    app.id,
                                    "roleId",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 w-full sm:w-48">
                                  <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border shadow-lg bg-white">
                                  {roles.map(
                                    (role) => (
                                      <SelectItem
                                        key={
                                          role.id
                                        }
                                        value={
                                          role.id
                                        }
                                        className="font-bold"
                                      >
                                        {
                                          role.name
                                        }
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={
                                  assignments[
                                    app.id
                                  ]?.departmentId
                                }
                                onValueChange={(
                                  val,
                                ) =>
                                  handleAssignmentChange(
                                    app.id,
                                    "departmentId",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 w-full sm:w-48">
                                  <SelectValue placeholder="Select Dept" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border shadow-lg bg-white">
                                  {departments.map(
                                    (dept) => (
                                      <SelectItem
                                        key={
                                          dept.id
                                        }
                                        value={
                                          dept.id
                                        }
                                        className="font-bold"
                                      >
                                        {
                                          dept.name
                                        }
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right px-10">
                              <Button
                                onClick={() =>
                                  handleForwardToHCM(
                                    app,
                                  )
                                }
                                disabled={
                                  processingId ===
                                  app.id
                                }
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black h-12 px-8 rounded-xl shadow-sm transition-all active:scale-95"
                              >
                                {processingId ===
                                app.id
                                  ? "Processing..."
                                  : "Activate in HCM"}
                                {!processingId && (
                                  <Send className="ml-3 h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="history"
            className="animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
              <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <History className="h-6 w-6 text-slate-400" />
                  Process History
                </CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Log of recently processed hire
                  integrations
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="py-6 px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">
                        Personnel
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">
                        Assigned Details
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">
                        Processed At
                      </TableHead>
                      <TableHead className="text-right px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onboardingHistory.length ===
                    0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-xs"
                        >
                          No process logs
                          available
                        </TableCell>
                      </TableRow>
                    ) : (
                      onboardingHistory.map(
                        (hist) => (
                          <TableRow
                            key={hist.id}
                            className="border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <TableCell className="py-6 px-10 font-black text-slate-700">
                              <div>
                                {hist.first_name}{" "}
                                {hist.last_name}
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
                                  {hist.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase text-blue-600 tracking-tight">
                                  {
                                    hist.roles
                                      ?.name
                                  }
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">
                                  {
                                    hist
                                      .departments
                                      ?.name
                                  }
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[11px] font-bold text-slate-400">
                              {new Date(
                                hist.updated_at,
                              ).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </TableCell>
                            <TableCell className="text-right px-10">
                              <span
                                className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border ${
                                  hist.status ===
                                  "onboarded"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}
                              >
                                {hist.status ===
                                "onboarded"
                                  ? "Activated"
                                  : "Pending HCM"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="recent"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
              <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                  Recently Activated Hires
                </CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Top 10 most recent system
                  activations in Profiles
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {recentOnboards.length === 0 ? (
                  <div className="p-20 text-center opacity-30 font-black uppercase text-xs tracking-widest">
                    No active hires recently
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentOnboards.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-8 px-10 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-lg">
                            {emp.full_name
                              ?.split(" ")
                              .map(
                                (n: any) => n[0],
                              )
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg leading-tight">
                              {emp.full_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                ID:{" "}
                                {
                                  emp.id.split(
                                    "-",
                                  )[0]
                                }
                              </span>
                              <span className="h-1 w-1 rounded-full bg-slate-200" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                {emp.roles
                                  ?.name ||
                                  emp.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-700">
                            {
                              emp.departments
                                ?.name
                            }
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                            Activated{" "}
                            {new Date(
                              emp.updated_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
