"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Building2,
  Plus,
  ArrowLeft,
  LayoutGrid,
  Zap,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import {
  createRole,
  createDepartment,
} from "@/app/actions/hr";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function Core3HCMPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<
    any[]
  >([]);

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] =
    useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] =
    useState(false);

  const [roleFormData, setRoleFormData] =
    useState({ name: "", description: "" });
  const [deptFormData, setDeptFormData] =
    useState({
      name: "",
      code: "",
      description: "",
    });
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, deptRes] = await Promise.all(
      [
        supabase
          .schema("bpm-anec-global")
          .from("roles")
          .select("*")
          .order("name"),
        supabase
          .schema("bpm-anec-global")
          .from("departments")
          .select("*")
          .order("name"),
      ],
    );
    if (rolesRes.data) setRoles(rolesRes.data);
    if (deptRes.data)
      setDepartments(deptRes.data);
    setLoading(false);
  };

  const handleCreateRole = async () => {
    if (!roleFormData.name)
      return toast.error("Role name is required");
    setSubmitting(true);
    const res = await createRole(
      roleFormData.name,
      roleFormData.description,
    );
    if (res.success) {
      toast.success("Role created successfully");
      setIsRoleModalOpen(false);
      setRoleFormData({
        name: "",
        description: "",
      });
      fetchData();
    } else toast.error(res.error);
    setSubmitting(false);
  };

  const handleCreateDept = async () => {
    if (!deptFormData.name)
      return toast.error(
        "Department name is required",
      );
    if (!deptFormData.code)
      return toast.error(
        "Department code is required",
      );
    setSubmitting(true);
    const res = await createDepartment(
      deptFormData.name,
      deptFormData.code,
    );
    if (res.success) {
      toast.success(
        "Department created successfully",
      );
      setIsDeptModalOpen(false);
      setDeptFormData({
        name: "",
        code: "",
        description: "",
      });
      fetchData();
    } else toast.error(res.error);
    setSubmitting(false);
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
              <Link href="/core/transaction3/admin">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Org Governance
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Org Governance
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
            Core 3: Human Capital & Authority
            Management
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() =>
              setIsDeptModalOpen(true)
            }
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-lg h-14 px-8 border border-slate-200 shadow-none hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 gap-2"
          >
            <Building2 className="mr-2 h-5 w-5" />{" "}
            + Department
          </Button>
          <Button
            onClick={() =>
              setIsRoleModalOpen(true)
            }
            className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-14 px-8 shadow-none transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Shield className="mr-2 h-5 w-5" /> +
            Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles Section */}
        <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Shield className="h-6 w-6 text-indigo-500" />
                System Roles
              </CardTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Access control & responsibilities
              </p>
            </div>
            <Zap className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent className="p-10">
            <div className="space-y-4">
              {loading ? (
                <div className="py-10 text-center animate-pulse text-slate-300 font-bold">
                  Synchronizing...
                </div>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-lg border border-slate-50 hover:bg-slate-50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">
                        {role.name}
                      </h4>
                      <p className="text-sm text-slate-400 font-medium">
                        {role.description ||
                          "No description provided"}
                      </p>
                    </div>
                    <LayoutGrid className="h-5 w-5 text-slate-100 group-hover:text-slate-200 transition-colors" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Departments Section */}
        <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-emerald-500" />
                Departments
              </CardTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Organizational structure & groups
              </p>
            </div>
            <LayoutGrid className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent className="p-10">
            <div className="space-y-4">
              {loading ? (
                <div className="py-10 text-center animate-pulse text-slate-300 font-bold">
                  Synchronizing...
                </div>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-6 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-900 text-lg">
                          {dept.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                          {dept.code}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 font-medium">
                        {dept.description ||
                          "No description provided"}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Dialog */}
      <Dialog
        open={isRoleModalOpen}
        onOpenChange={setIsRoleModalOpen}
      >
        <DialogContent className="sm:max-w-md border-none rounded-lg shadow-none transition-all active:scale-95">
          <div className="p-8 pb-6 bg-white border-b border-slate-100">
            <DialogTitle className="text-2xl font-black text-slate-900">
              Define New Role
            </DialogTitle>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              System level access definition
            </p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
                Role Name
              </Label>
              <Input
                value={roleFormData.name}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g. HCM Manager"
                className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
                Description
              </Label>
              <Input
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({
                    ...roleFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Responsibilities and permissions..."
                className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold"
              />
            </div>
            <Button
              onClick={handleCreateRole}
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-14 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              {submitting
                ? "Processing..."
                : "Create Authority Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dept Dialog */}
      <Dialog
        open={isDeptModalOpen}
        onOpenChange={setIsDeptModalOpen}
      >
        <DialogContent className="sm:max-w-md border-none rounded-lg shadow-none transition-all active:scale-95">
          <div className="p-8 pb-6 bg-white border-b border-slate-100">
            <DialogTitle className="text-2xl font-black text-slate-900">
              Create Department
            </DialogTitle>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              New organizational unit
            </p>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
                  Department Name
                </Label>
                <Input
                  value={deptFormData.name}
                  onChange={(e) =>
                    setDeptFormData({
                      ...deptFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Strategic Operations"
                  className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
                  Code
                </Label>
                <Input
                  value={deptFormData.code}
                  onChange={(e) =>
                    setDeptFormData({
                      ...deptFormData,
                      code: e.target.value,
                    })
                  }
                  placeholder="e.g. STROP"
                  className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
                Description
              </Label>
              <Input
                value={deptFormData.description}
                onChange={(e) =>
                  setDeptFormData({
                    ...deptFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Purpose of this unit..."
                className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold"
              />
            </div>
            <Button
              onClick={handleCreateDept}
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-14 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              {submitting
                ? "Processing..."
                : "Initialize Department"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
