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
  ChevronLeft,
  Users,
  CheckCircle2,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function BenefitsManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [benefits, setBenefits] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newBenefit, setNewBenefit] = useState({
    employee_name: "",
    benefit_type: "HMO Platinum",
    coverage_amount: 250000,
    status: "active",
    enrollment_date: new Date()
      .toISOString()
      .split("T")[0],
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
  }, []);

  const fetchBenefits: any = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("hmo_benefits")
      .select("*")
      .order("created_at", { ascending: false });

    setBenefits(data || []);
    setLoading(false);
  };

  const handleAddBenefit = async () => {
    if (!newBenefit.employee_name)
      return toast.error(
        "Employee name is required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("hmo_benefits")
      .insert([newBenefit]);

    if (error) {
      toast.error("Failed to enroll employee");
    } else {
      toast.success(
        "Employee enrolled in benefit plan",
      );
      setIsModalOpen(false);
      setNewBenefit({
        employee_name: "",
        benefit_type: "HMO Platinum",
        coverage_amount: 250000,
        status: "active",
        enrollment_date: new Date()
          .toISOString()
          .split("T")[0],
      });
      fetchBenefits();
    }
  };

  const filteredBenefits = benefits.filter(
    (b) =>
      b.employee_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      b.benefit_type
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() =>
                router.push("/hr/dept4")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              Benefits & HMO
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Employee wellness & Corporate perks
              administration
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-emerald-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                New Enrollment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 italic">
                  Benefit Enrollment
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="employee"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Employee Name
                  </Label>
                  <Input
                    id="employee"
                    value={
                      newBenefit.employee_name
                    }
                    onChange={(e) =>
                      setNewBenefit({
                        ...newBenefit,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Rachel Adams"
                    className="rounded-xl border-slate-100"
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
                    value={
                      newBenefit.benefit_type
                    }
                    onChange={(e) =>
                      setNewBenefit({
                        ...newBenefit,
                        benefit_type:
                          e.target.value,
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>
                      HMO Platinum Plus
                    </option>
                    <option>HMO Executive</option>
                    <option>
                      Life Insurance Gold
                    </option>
                    <option>
                      Gym Membership Premium
                    </option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="coverage"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Coverage Limit (₱)
                  </Label>
                  <Input
                    id="coverage"
                    type="number"
                    value={
                      newBenefit.coverage_amount
                    }
                    onChange={(e) =>
                      setNewBenefit({
                        ...newBenefit,
                        coverage_amount: Number(
                          e.target.value,
                        ),
                      })
                    }
                    className="rounded-xl border-slate-100"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddBenefit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11"
              >
                Confirm Enrollment
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <Input
            placeholder="Search employees or plans..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-emerald-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-white rounded-[40px] animate-pulse"
                />
              ))
            : filteredBenefits.map((b) => (
                <Card
                  key={b.id}
                  className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] overflow-hidden group hover:scale-[1.02] transition-all bg-white"
                >
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest leading-none mb-1">
                        {b.benefit_type}
                      </p>
                      <h3 className="text-xl font-black text-slate-900 italic tracking-tighter transition-all group-hover:text-emerald-600">
                        {b.employee_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-emerald-400" />
                        Limit: ₱
                        {(
                          b.coverage_amount || 0
                        ).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        Active
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
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
              ))}
        </div>
      </div>
    </div>
  );
}
