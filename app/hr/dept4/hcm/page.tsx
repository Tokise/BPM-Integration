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

export default function HCMPage() {
  const supabase = createClient();
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
    });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [deptRes, rolesRes, appRes] =
      await Promise.all([
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
          .select(
            "*, roles!assigned_role_id(name), departments!assigned_department_id(name)",
          )
          .eq("status", "awaiting_hcm")
          .order("updated_at", {
            ascending: false,
          }),
      ]);

    const allRoles = rolesRes.data || [];
    const filteredRoles = allRoles.filter(
      (r: any) =>
        !["customer", "seller"].includes(
          r.name?.toLowerCase(),
        ),
    );
    const employeeRoleIds = filteredRoles.map(
      (r: any) => r.id,
    );

    if (deptRes.data)
      setDepartments(deptRes.data);
    setRoles(filteredRoles);
    if (appRes.data)
      setPendingApplicants(appRes.data);

    const { data: empData, error: empError } =
      await supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select(
          "*, departments!profiles_department_id_fkey(name), roles(name)",
        )
        .in("role_id", employeeRoleIds)
        .order("full_name");

    setEmployees(empData || []);
    setLoading(false);
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
    });
    setIsEditModalOpen(true);
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

  const paginatedApplicants =
    pendingApplicants.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  const totalPages = Math.ceil(
    pendingApplicants.length / itemsPerPage,
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr">HR Hub</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr/dept4">
                Payroll (Dept 4)
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              HCM Central
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">
            HCM Central
          </h1>
          <p className="font-bold text-slate-500 uppercase text-xs tracking-[0.3em]">
            Human Capital Management & Governance
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="directory"
        className="w-full space-y-8"
      >
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[20px] h-auto w-fit flex gap-1">
          <TabsTrigger
            value="directory"
            className="rounded-[14px] px-8 py-3.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl text-slate-400"
          >
            Personnel Profile
          </TabsTrigger>
          <TabsTrigger
            value="provisioning"
            className="rounded-[14px] px-8 py-3.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-emerald-200/30 text-slate-400"
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
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[40px] bg-white overflow-hidden min-h-[600px]">
            <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black tracking-tight">
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
                  className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold"
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
                      filteredEmployees.map(
                        (emp) => (
                          <TableRow
                            key={emp.id}
                            className="border-slate-50 hover:bg-slate-50/30 transition-colors"
                          >
                            <TableCell className="py-6 px-8">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500">
                                  {
                                    emp
                                      .full_name?.[0]
                                  }
                                </div>
                                <div>
                                  <p className="font-black text-slate-900">
                                    <PrivacyMask
                                      value={
                                        emp.full_name
                                      }
                                    />
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400">
                                    {emp.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black uppercase text-amber-600">
                                  {emp.roles
                                    ?.name ||
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
                                    className="h-9 w-9 p-0 rounded-xl"
                                  >
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-2xl shadow-2xl border-none p-2 min-w-[160px]"
                                >
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
          </Card>
        </TabsContent>

        <TabsContent
          value="provisioning"
          className="space-y-8"
        >
          <Card className="border-none shadow-2xl shadow-emerald-100/20 rounded-[40px] bg-emerald-50/20 overflow-hidden">
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
                          className="bg-emerald-500 text-white font-black h-9 rounded-xl"
                        >
                          Provision
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs reconstructed below with same logic */}
      <Dialog
        open={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
      >
        <DialogContent className="rounded-[32px] p-8">
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
              <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none">
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
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"
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
        <DialogContent className="rounded-[32px] p-8">
          <DialogTitle className="text-2xl font-black">
            Edit Record
          </DialogTitle>
          <div className="space-y-6 pt-6">
            <Input
              value={editFormData.fullName}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  fullName: e.target.value,
                })
              }
              className="h-14 bg-slate-50 border-none rounded-2xl"
            />
            <Button
              onClick={handleUpdateEmployee}
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
