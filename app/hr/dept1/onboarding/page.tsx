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

export default function OnboardingPage() {
  const supabase = createClient();
  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });
      if (data) setDepartments(data);
      setLoading(false);
    };
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
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
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingForm({
  departments,
}: {
  departments: any[];
}) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "hr",
    departmentId: "",
  });
  const [submitting, setSubmitting] =
    useState(false);

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
              </SelectContent>
            </Select>
          </div>
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
