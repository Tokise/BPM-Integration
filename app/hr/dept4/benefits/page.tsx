"use client";

import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Search,
  Plus,
  ShieldCheck,
  Activity,
  Zap,
  MoreVertical,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Heart,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

export default function BenefitsManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (profile?.departments as any)?.code;
  const isDept1 = pathname.startsWith("/hr/dept1");
  const isDept2 = pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1 ? "/hr/dept1" : isDept2 ? "/hr/dept2" : "/hr/dept4";
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBenefit, setNewBenefit] = useState({
    employee_name: "",
    benefit_type: "HMO Platinum",
    coverage_amount: 250000,
    status: "active",
    enrollment_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchBenefits();

    const channel = supabase
      .channel("benefits_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "hmo_benefits",
        },
        fetchBenefits,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]); // Added profile?.id to dependency to re-fetch when user loads

  const fetchBenefits = async () => {
    if (!profile?.id) return;
    setLoading(true);
    let query = supabase
      .schema("bpm-anec-global")
      .from("hmo_benefits")
      .select("*, profiles(full_name, role)");

    // Strict Personal View for Integrated Departments or Employees
    if (
      profile?.role === "employee" ||
      profile?.role === "hr4_employee" ||
      isDept1 ||
      isDept2
    ) {
      query = query.eq("employee_id", profile?.id);
    }

    const { data } = await query.order("created_at", {
      ascending: false,
    });

    setBenefits(data || []);
    setLoading(false);
  };

  const handleAddBenefit = async () => {
    if (!newBenefit.employee_name && profile?.role !== "employee") {
      return toast.error("Employee name is required");
    }

    const submission = {
      ...newBenefit,
      employee_id: profile?.id,
      employee_name:
        profile?.role === "employee"
          ? profile?.full_name
          : newBenefit.employee_name,
    };

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("hmo_benefits")
      .insert([submission]);

    if (error) {
      toast.error("Failed to enroll employee");
    } else {
      toast.success("Employee enrolled in benefit plan");
      setIsModalOpen(false);
      setNewBenefit({
        employee_name: "",
        benefit_type: "HMO Platinum",
        coverage_amount: 250000,
        status: "active",
        enrollment_date: new Date().toISOString().split("T")[0],
      });
      fetchBenefits();
    }
  };

  const filteredBenefits = benefits.filter(
    (b) =>
      b.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.benefit_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.benefit_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Link href={baseUrl}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Benefits & HMO
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Benefits & HMO
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Employee wellness & Corporate perks administration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <Input
              placeholder="Search employees or plans..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-emerald-500 font-medium text-xs shadow-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!isDept1 && !isDept2 && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3">
                  <Plus className="h-4 w-4" /> New Enrollment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
                <div className="p-8 space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                      Enrollment
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="employee"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Employee Name
                      </Label>
                      <Input
                        id="employee"
                        value={newBenefit.employee_name}
                        onChange={(e) =>
                          setNewBenefit({
                            ...newBenefit,
                            employee_name: e.target.value,
                          })
                        }
                        placeholder="e.g. Rachel Adams"
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="type"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Plan Type
                      </Label>
                      <select
                        id="type"
                        value={newBenefit.benefit_type}
                        onChange={(e) =>
                          setNewBenefit({
                            ...newBenefit,
                            benefit_type: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-xs focus:outline-none"
                      >
                        <option>HMO Platinum Plus</option>
                        <option>HMO Executive</option>
                        <option>Life Insurance Gold</option>
                        <option>Gym Membership Premium</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddBenefit}
                    className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-none uppercase tracking-widest text-[10px]"
                  >
                    Confirm Enrollment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-lg animate-pulse border border-slate-100"
              />
            ))
          : filteredBenefits.length > 0 ? (
              filteredBenefits.map((b) => (
                <Card
                  key={b.id}
                  className="border border-slate-200 shadow-none rounded-xl overflow-hidden group transition-all bg-white relative"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-black border border-slate-100 text-sm">
                        {b.benefit_name?.charAt(0) || "B"}
                      </div>
                      {!isDept1 && !isDept2 && (
                        <button className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {b.benefit_type}
                      </p>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter transition-all group-hover:text-black">
                        {b.benefit_name || b.benefit_type}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 font-bold">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 border border-slate-200">
                        {(b.profiles?.full_name || b.employee_name)?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">
                          <PrivacyMask value={b.profiles?.full_name || b.employee_name} />
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {b.profiles?.role || "Employee"}
                        </p>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100 shrink-0">
                        Active
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Since {b.enrollment_date}
                      </span>
                      <Button
                        variant="ghost"
                        className="text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 p-0 h-auto"
                      >
                        View Policy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                  No current benefits
                </p>
                <p className="text-slate-400 text-xs mt-3 font-medium">
                  Your active benefits and insurance plans will be
                  listed here once enrolled.
                </p>
              </div>
            )}
      </div>
    </div>
  );
}
