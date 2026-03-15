"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Database,
  Search,
  Filter,
  Plus,
  UserPlus,
  Settings2,
  Trash2,
  Archive,
  Edit2,
  Shield,
  Building2,
  CheckCircle2,
  Loader2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Users,
  Activity,
  LayoutGrid,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import {
  onboardEmployee,
  archiveEmployee,
  deleteEmployee,
  updateEmployee,
} from "@/app/actions/hr";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import {
  usePathname,
  useRouter,
} from "next/navigation";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BadgeCheck,
  Briefcase,
  MapPin,
  Mail,
  History as HistoryIcon,
  Award,
  CalendarDays,
} from "lucide-react";

export default function HCMPage() {
  const supabase = createClient();
  const pathname = usePathname();
  const { profile } = useUser();
  const userDeptCode = (
    profile?.departments as any
  )?.code;
  const isDept1 =
    pathname.startsWith("/hr/dept1");
  const isDept2 =
    pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1
    ? "/hr/dept1"
    : isDept2
      ? "/hr/dept2"
      : "/hr/dept4";
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [
    pendingApplicants,
    setPendingApplicants,
  ] = useState<any[]>([]);
  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [currentPage, setCurrentPage] =
    useState(1);
  const [selectedProfile, setSelectedProfile] =
    useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] =
    useState(false);
  const [profileHistory, setProfileHistory] =
    useState<any[]>([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const itemsPerPage = 10;

  const [
    isAccountModalOpen,
    setIsAccountModalOpen,
  ] = useState(false);
  const [
    selectedApplicant,
    setSelectedApplicant,
  ] = useState<any>(null);
  const [accountFormData, setAccountFormData] =
    useState({
      roleId: "",
      departmentId: "",
    });

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<any>(null);
  const [editFormData, setEditFormData] =
    useState({
      fullName: "",
      roleId: "",
      departmentId: "",
      promotionType: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, rolesRes, appRes] = await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("departments")
          .select("*")
          .order("name"),
        supabase
          .schema("bpm-anec-global")
          .from("roles")
          .select("*")
          .order("name"),
        supabase
          .schema("bpm-anec-global")
          .from("applicant_management")
          .select("*, departments!assigned_department_id(name)")
          .eq("status", "awaiting_hcm")
          .order("updated_at", { ascending: false }),
      ]);



      if (deptRes.data) setDepartments(deptRes.data);
      if (appRes.data) setPendingApplicants(appRes.data);

      let empQuery = supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("*, departments!profiles_department_id_fkey(name)")
        .not("role", "in", '("customer","seller")');

      if (isDept1 || isDept2) {
        if (profile?.id) {
          empQuery = empQuery.eq("id", profile.id);
        } else {
          setEmployees([]);
          setLoading(false);
          return;
        }
      }

      const { data: empData, error: empError } = await empQuery.order("full_name");

      if (empError) {
        toast.error("Error loading directory");
      }

      setEmployees(empData || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedApplicant) return;
    setSubmitting(true);
    const toastId = toast.loading(
      "Creating system account...",
    );

    const res = await onboardEmployee({
      fullName: `${selectedApplicant.first_name} ${selectedApplicant.last_name}`,
      email: selectedApplicant.email,
      roleId: accountFormData.roleId,
      departmentId: accountFormData.departmentId,
      position: selectedApplicant.position || selectedApplicant.job_title
    });

    if (res.success) {
      await supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .update({ status: "onboarded" })
        .eq("id", selectedApplicant.id);
      toast.success(
        "Account created successfully!",
        { id: toastId },
      );
      setIsAccountModalOpen(false);
      fetchData();
    } else {
      toast.error(
        res.error || "Failed to create account",
        { id: toastId },
      );
    }
    setSubmitting(false);
  };

  const handleArchive = async (
    id: string,
    current: boolean,
  ) => {
    const res = await archiveEmployee(
      id,
      !current,
    );
    if (res.success) {
      toast.success(
        current
          ? "Employee unarchived"
          : "Employee archived",
      );
      fetchData();
    } else toast.error(res.error);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this employee account?",
      )
    )
      return;
    const res = await deleteEmployee(id);
    if (res.success) {
      toast.success("Account deleted");
      fetchData();
    } else toast.error(res.error);
  };

  const handleEditOpen = (emp: any) => {
    setEditingEmployee(emp);
    setEditFormData({
      fullName: emp.full_name || "",
      roleId: emp.role_id || "",
      departmentId: emp.department_id || "",
      promotionType: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
    setIsEditModalOpen(true);
  };

  const handleViewProfile = async (emp: any) => {
    setSelectedProfile(emp);
    setIsProfileOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .schema("bpm-anec-global")
        .from("system_logs")
        .select("*")
        .eq("entity_id", emp.id)
        .order("created_at", {
          ascending: false,
        });
      setProfileHistory(data || []);
    } catch (error) {
      console.error(
        "History fetch error:",
        error,
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    setSubmitting(true);
    const toastId = toast.loading(
      "Updating employee...",
    );
    const res = await updateEmployee(
      editingEmployee.id,
      editFormData,
    );
    if (res.success) {
      toast.success("Employee updated", {
        id: toastId,
      });
      setIsEditModalOpen(false);
      fetchData();
    } else {
      toast.error(res.error || "Update failed", {
        id: toastId,
      });
    }
    setSubmitting(false);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp.full_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (emp.email || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalEmployeePages = Math.ceil(
    filteredEmployees.length / itemsPerPage,
  );

  const paginatedApplicants =
    pendingApplicants.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  const totalApplicantPages = Math.ceil(
    pendingApplicants.length / itemsPerPage,
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
              HCM Central
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            HCM Central
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.3em]">
            Human Capital Management & Governance
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="directory"
        className="w-full space-y-8"
      >
        <TabsList className="bg-slate-100 p-1 rounded-lg h-auto w-fit flex gap-1">
          <TabsTrigger
            value="directory"
            className="rounded-md px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-400"
          >
            Personnel Profile
          </TabsTrigger>
          <TabsTrigger
            value="provisioning"
            className="rounded-md px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-400"
          >
            Account Provisioning
            {pendingApplicants.length > 0 && (
              <span className="ml-2 bg-emerald-500 text-white h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center text-[10px]">
                {pendingApplicants.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="directory"
          className="space-y-8"
        >
          <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden min-h-[600px]">
            <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black tracking-tight uppercase">
                  Employee Directory
                </CardTitle>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Manage Active System Records (
                  {employees.length})
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input
                  placeholder="Filter records..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="h-10 pl-12 rounded-lg bg-slate-50 border border-slate-200 font-bold"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest animate-pulse">
                  Synchronizing records...
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/50 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-6 px-8">
                        Identity
                      </TableHead>
                      <TableHead>
                        Role & Dept
                      </TableHead>
                      <TableHead>
                        Status
                      </TableHead>
                      <TableHead className="text-right px-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length ===
                    0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-32 text-center text-slate-400 font-bold"
                        >
                          No records match.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEmployees.map(
                        (emp) => (
                          <TableRow
                            key={emp.id}
                            className="border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <TableCell className="py-6 px-8">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200">
                                  {
                                    emp
                                      .full_name?.[0]
                                  }
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 leading-none">
                                    <PrivacyMask
                                      value={
                                        emp.full_name
                                      }
                                    />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {emp.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black uppercase text-amber-600">
                                  {emp.role ||
                                    "No Role"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {emp.departments
                                    ?.name ||
                                    "Unassigned"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${emp.is_archived ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-500"}`}
                              >
                                {emp.is_archived
                                  ? "Archived"
                                  : "Active"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right px-8">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                >
                                  <Button
                                    variant="ghost"
                                    className="h-9 w-9 p-0 rounded-lg"
                                  >
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-lg shadow-2xl border border-slate-200 p-2 min-w-[160px]"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewProfile(
                                        emp,
                                      )
                                    }
                                    className="rounded-xl px-4 py-3 font-bold text-slate-700"
                                  >
                                    <UserCheck className="h-4 w-4 mr-3 text-indigo-500" />{" "}
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditOpen(
                                        emp,
                                      )
                                    }
                                    className="rounded-xl px-4 py-3 font-bold text-slate-700"
                                  >
                                    <Edit2 className="h-4 w-4 mr-3 text-blue-500" />{" "}
                                    Edit Record
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchive(
                                        emp.id,
                                        emp.is_archived,
                                      )
                                    }
                                    className="rounded-xl px-4 py-3 font-bold text-slate-700"
                                  >
                                    <Archive className="h-4 w-4 mr-3 text-amber-500" />{" "}
                                    {emp.is_archived
                                      ? "Restore"
                                      : "Archive"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDelete(
                                        emp.id,
                                      )
                                    }
                                    className="rounded-xl px-4 py-3 font-bold text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" />{" "}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {!loading && totalEmployeePages > 1 && (
              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Page {currentPage} of {totalEmployeePages}
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
                    disabled={currentPage === totalEmployeePages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent
          value="provisioning"
          className="space-y-8"
        >
          <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
            {/* Account Provisioning Table ... Similar logic as before */}
            <Table>
              <TableHeader className="bg-emerald-50/30">
                <TableRow>
                  <TableHead className="py-5 px-6 font-black uppercase text-[9px]">
                    Candidate
                  </TableHead>
                  <TableHead className="text-right px-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplicants.map(
                  (app) => (
                    <TableRow key={app.id}>
                      <TableCell className="py-5 px-6">
                        <p className="font-black text-slate-900 text-sm">
                          {app.first_name}{" "}
                          {app.last_name}
                        </p>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          onClick={() => {
                            setSelectedApplicant(
                              app,
                            );
                            setIsAccountModalOpen(
                              true,
                            );
                          }}
                          size="sm"
                          className="bg-slate-900 text-white font-black h-9 rounded-lg px-4"
                        >
                          Provision
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
            {!loading && totalApplicantPages > 1 && (
              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Page {currentPage} of {totalApplicantPages}
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
                    disabled={currentPage === totalApplicantPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-9 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs reconstructed below with same logic */}
      <Dialog
        open={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
      >
        <DialogContent className="rounded-lg p-8 border border-slate-200 bg-white">
          <DialogTitle className="text-2xl font-black">
            Finalize Account
          </DialogTitle>
          <div className="space-y-6 pt-6">
            <Label className="uppercase text-[10px] font-black text-slate-400">
              System Role
            </Label>
            <Select
              value={accountFormData.roleId}
              onValueChange={(v) =>
                setAccountFormData({
                  ...accountFormData,
                  roleId: v,
                })
              }
            >
              <SelectTrigger className="h-10 rounded-lg bg-slate-50 border border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem
                    key={r.id}
                    value={r.id}
                  >
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreateAccount}
              className="w-full h-10 rounded-lg bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent className="rounded-lg p-8 border border-slate-200 bg-white">
          <DialogTitle className="text-2xl font-black">
            Edit Record
          </DialogTitle>
          <div className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black text-slate-400">Full Name</Label>
              <Input
                value={editFormData.fullName}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    fullName: e.target.value,
                  })
                }
                className="h-10 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-slate-400">System Role</Label>
                <Select
                  value={editFormData.roleId}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, roleId: v })
                  }
                >
                  <SelectTrigger className="h-10 bg-slate-50 border border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-slate-400">Department</Label>
                <Select
                  value={editFormData.departmentId}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, departmentId: v })
                  }
                >
                  <SelectTrigger className="h-10 bg-slate-50 border border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select Dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-indigo-600">Promotion Type</Label>
                <Select
                  value={editFormData.promotionType}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, promotionType: v })
                  }
                >
                  <SelectTrigger className="h-10 bg-indigo-50/50 border border-indigo-100 rounded-lg text-indigo-900 font-bold">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">Regular Update</SelectItem>
                    <SelectItem value="Vertical Promotion">Vertical Promotion</SelectItem>
                    <SelectItem value="Lateral Transfer">Lateral Transfer</SelectItem>
                    <SelectItem value="Department Shift">Department Shift</SelectItem>
                    <SelectItem value="Step Increment">Step Increment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-slate-400">Effective Date</Label>
                <Input
                  type="date"
                  value={editFormData.effectiveDate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      effectiveDate: e.target.value,
                    })
                  }
                  className="h-10 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateEmployee}
              className="w-full h-10 rounded-lg bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Employee Profile Sheet */}
      <Sheet
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      >
        <SheetContent className="max-w-xl w-full p-0 border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-500">
          {selectedProfile && (
            <div className="flex flex-col h-full">
              {/* Header/Cover */}
              <div className="h-32 bg-indigo-600 relative">
                <div className="absolute -bottom-12 left-10 h-24 w-24 rounded-3xl bg-white p-1.5 shadow-xl border border-slate-100">
                  <div className="h-full w-full rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 uppercase border border-indigo-100">
                    {
                      selectedProfile
                        .full_name?.[0]
                    }
                  </div>
                </div>
              </div>

              <div className="mt-16 px-10 pb-10 space-y-8">
                {/* Identity */}
                <div className="space-y-1">
                  <div className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                    <PrivacyMask
                      value={
                        selectedProfile.full_name
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {selectedProfile.email}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      Remote HQ
                    </div>
                  </div>
                </div>

                {/* Badges/Roles */}
                <div className="flex flex-wrap gap-2">
                  <div className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />{" "}
                    {selectedProfile.roles?.name}
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <BadgeCheck className="h-3 w-3" />{" "}
                    {
                      selectedProfile.departments
                        ?.name
                    }
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Award className="h-3 w-3" />{" "}
                    Senior Associate
                  </div>
                </div>

                {/* History/Records Section */}
                <div className="pt-8 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <HistoryIcon className="h-4 w-4 text-indigo-600" />
                      System Activity Logs
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200">
                      Total:{" "}
                      {profileHistory.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {historyLoading ? (
                      <div className="p-10 text-center font-black uppercase text-[10px] text-slate-400 tracking-widest animate-pulse">
                        Retrieving Audit Trail...
                      </div>
                    ) : profileHistory.length ===
                      0 ? (
                      <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          No historical changes
                          found
                        </p>
                      </div>
                    ) : (
                      profileHistory.map(
                        (log, i) => (
                          <div
                            key={log.id}
                            className="relative pl-8 pb-8 group last:pb-0"
                          >
                            {/* Timeline line */}
                            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-slate-200 group-last:bottom-auto group-last:h-6" />
                            {/* Timeline Dot */}
                            <div className="absolute left-[6px] top-1.5 h-3 w-3 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform" />

                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                  {log.action?.replace(
                                    /_/g,
                                    " ",
                                  )}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(
                                    log.created_at,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                {log.entity_type}{" "}
                                record modified by
                                system
                                administrator
                              </p>
                              {log.details && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl font-mono text-[9px] text-slate-400 flex flex-wrap gap-2">
                                  {Object.entries(
                                    log.details,
                                  ).map(
                                    ([
                                      k,
                                      v,
                                    ]: any) => (
                                      <span
                                        key={k}
                                        className="bg-white px-2 py-0.5 rounded border border-slate-100"
                                      >
                                        {k}:{" "}
                                        {String(
                                          v,
                                        )}
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
