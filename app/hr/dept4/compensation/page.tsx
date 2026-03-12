"use client";

import { useEffect, useState } from "react";
import {
  Scale,
  Search,
  Plus,
  TrendingUp,
  Zap,
  DollarSign,
  MoreVertical,
  ChevronLeft,
  Users,
  PieChart,
  Target,
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

export default function CompensationManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [compensation, setCompensation] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newComp, setNewComp] = useState({
    employee_name: "",
    base_salary: 0,
    bonus_percentage: 0,
    last_review: new Date()
      .toISOString()
      .split("T")[0],
    grade_level: "Senior",
  });

  useEffect(() => {
    fetchCompensation();

    const channel = supabase
      .channel("compensation_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "compensation_management",
        },
        fetchCompensation,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompensation = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("compensation_management")
      .select("*")
      .order("created_at", { ascending: false });

    setCompensation(data || []);
    setLoading(false);
  };

  const handleAddComp = async () => {
    if (
      !newComp.employee_name ||
      newComp.base_salary <= 0
    )
      return toast.error(
        "All fields are required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("compensation_management")
      .insert([newComp]);

    if (error) {
      toast.error("Failed to add record");
    } else {
      toast.success("Compensation record added");
      setIsModalOpen(false);
      setNewComp({
        employee_name: "",
        base_salary: 0,
        bonus_percentage: 0,
        last_review: new Date()
          .toISOString()
          .split("T")[0],
        grade_level: "Senior",
      });
      fetchCompensation();
    }
  };

  const filteredComp = compensation.filter((c) =>
    c.employee_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
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
              Compensation & Grades
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Compensation & Grades
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Salary mapping & total rewards
            architecture
          </p>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-slate-200/50 uppercase tracking-widest text-[10px] flex items-center gap-3">
              <Plus className="h-4 w-4" /> Adjust
              Salary
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Adjustment
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
                    value={newComp.employee_name}
                    onChange={(e) =>
                      setNewComp({
                        ...newComp,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. David Wilson"
                    className="h-14 rounded-2xl border-none bg-slate-50 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="salary"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Base Salary (₱)
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={newComp.base_salary}
                      onChange={(e) =>
                        setNewComp({
                          ...newComp,
                          base_salary: Number(
                            e.target.value,
                          ),
                        })
                      }
                      className="h-14 rounded-2xl border-none bg-slate-50 font-bold"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="level"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Level
                    </Label>
                    <select
                      id="level"
                      value={newComp.grade_level}
                      onChange={(e) =>
                        setNewComp({
                          ...newComp,
                          grade_level:
                            e.target.value,
                        })
                      }
                      className="flex h-14 w-full rounded-2xl border-none bg-slate-50 px-3 py-2 font-bold text-sm focus:outline-none"
                    >
                      <option>Junior</option>
                      <option>Associate</option>
                      <option>Senior</option>
                      <option>Principal</option>
                      <option>Executive</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleAddComp}
                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-100 uppercase tracking-widest text-[10px]"
              >
                Save Adjustment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <Input
          placeholder="Search employees or grades..."
          className="pl-11 h-14 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl focus-visible:ring-slate-900 font-medium"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 bg-white rounded-[40px] animate-pulse"
              />
            ))
          : filteredComp.map((c) => (
              <Card
                key={c.id}
                className="border-none shadow-2xl shadow-slate-100 rounded-[40px] overflow-hidden group hover:scale-[1.02] transition-all bg-white relative"
              >
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                      <Scale className="h-6 w-6" />
                    </div>
                    <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {c.grade_level}
                    </p>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">
                      <PrivacyMask
                        value={c.employee_name}
                      />
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Base
                        </p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">
                          ₱
                          <PrivacyMask
                            value={(
                              c.base_salary || 0
                            ).toLocaleString()}
                          />
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Bonus
                        </p>
                        <p className="text-lg font-black text-emerald-600">
                          +{c.bonus_percentage}%
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-widest mt-4">
                      Last Review: {c.last_review}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
