"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { onboardEmployee } from "@/app/actions/hr";
import { toast } from "sonner";

const EMPLOYEE_ROLES = [
  "hr",
  "logistics",
  "finance",
  "admin",
  "driver",
];

export default function OnboardingPage() {
  const supabase = createClient();
  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [recentOnboards, setRecentOnboards] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [deptRes, onboardsRes] =
      await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("departments")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select(
            "id, full_name, email, role, updated_at, departments (name)",
          )
          .in("role", EMPLOYEE_ROLES)
          .order("updated_at", {
            ascending: false,
          })
          .limit(10),
      ]);

    if (deptRes.data)
      setDepartments(deptRes.data);
    if (onboardsRes.data)
      setRecentOnboards(onboardsRes.data);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            New Hire Onboarding
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage employee integration and
            training
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black">
              Employee Onboarding
            </CardTitle>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">
              Register new hires and assign
              departments
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <OnboardingForm
            departments={departments}
            onSuccess={fetchData}
          />
        </CardContent>
      </Card>

      {/* Recent Onboards */}
      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-xl font-black">
            Recent Onboards
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
                Loading recent employees...
              </div>
            ) : recentOnboards.length > 0 ? (
              recentOnboards.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm uppercase">
                      {(emp.full_name || "?")
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">
                        {emp.full_name ||
                          "Unnamed"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {emp.email} •{" "}
                        {(emp.departments as any)
                          ?.name || "No Dept"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {emp.role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {emp.updated_at
                        ? new Date(
                            emp.updated_at,
                          ).toLocaleDateString(
                            "en-PH",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <UserCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">
                  No employees onboarded yet
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingForm({
  departments,
  onSuccess,
}: {
  departments: any[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "hr",
    departmentId: "",
  });
  const [submitting, setSubmitting] =
    useState(false);

  // Auto-assign department when driver is selected
  useEffect(() => {
    if (formData.role === "driver") {
      const logDept2 = departments.find(
        (d) =>
          d.code === "LOG_DEPT2" ||
          (d.name
            ?.toLowerCase()
            .includes("logistics") &&
            d.name?.includes("2")),
      );
      if (logDept2) {
        setFormData((prev) => ({
          ...prev,
          departmentId: logDept2.id,
        }));
      }
    }
  }, [formData.role, departments]);

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!formData.departmentId) {
      toast.error("Please select a department");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(
      "Creating employee account...",
    );

    try {
      const result =
        await onboardEmployee(formData);
      if (result.success) {
        toast.success(
          "Employee onboarded successfully! Activation email sent.",
          { id: toastId },
        );
        setFormData({
          email: "",
          fullName: "",
          role: "hr",
          departmentId: "",
        });
        onSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to onboard employee",
        { id: toastId },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-4"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Full Name
          </Label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              required
              placeholder="Ex. Juan Dela Cruz"
              className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fullName: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              required
              type="email"
              placeholder="employee@anec.global"
              className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            System Role
          </Label>
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
            <Select
              value={formData.role}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  role: val,
                })
              }
            >
              <SelectTrigger className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="hr">
                  Human Resource
                </SelectItem>
                <SelectItem value="logistics">
                  Logistics
                </SelectItem>
                <SelectItem value="finance">
                  Finance
                </SelectItem>
                <SelectItem value="admin">
                  System Admin
                </SelectItem>
                <SelectItem value="driver">
                  Driver (Logistics)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.role === "driver" && (
            <p className="text-[10px] font-bold text-amber-500 px-1 mt-1">
              ⚡ Auto-assigned to Logistics
              Department 2
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Department Assignment
          </Label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
            <Select
              value={formData.departmentId}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  departmentId: val,
                })
              }
              disabled={
                formData.role === "driver"
              }
            >
              <SelectTrigger className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.id}
                    value={dept.id}
                  >
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 pt-6">
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black h-14 rounded-2xl text-lg shadow-lg shadow-amber-200 transition-all active:scale-95"
        >
          {submitting
            ? "Processing..."
            : "Create Account & Send Invite"}
          <Send className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
