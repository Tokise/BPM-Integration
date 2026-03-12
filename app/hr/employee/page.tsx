"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CalendarDays,
  WalletCards,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  LayoutGrid,
  Zap,
  Briefcase,
  ShieldCheck,
  Fingerprint,
  ScanLine,
  FileText,
  CreditCard,
  HeartHandshake,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function HREmployeeDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] =
    useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const stats = [
    {
      label: "Available Leaves",
      val: "12 Days",
      icon: CalendarDays,
      color: "blue",
    },
    {
      label: "Attendance Streak",
      val: "14 Days",
      icon: Clock,
      color: "emerald",
    },
    {
      label: "Pending Claims",
      val: "P2,400.00",
      icon: WalletCards,
      color: "amber",
    },
    {
      label: "Benefits Utilization",
      val: "85%",
      icon: HeartHandshake,
      color: "indigo",
    },
  ];

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
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
            <BreadcrumbPage>
              My Workspace
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Hello,{" "}
            <PrivacyMask
              value={
                profile?.full_name || "Employee"
              }
            />
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
            Personal HR Portal •{" "}
            {profile?.role?.toUpperCase() ||
              "STAFF"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 hover:bg-slate-50"
          >
            Request Leave
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl h-11 px-6 shadow-lg">
            Clock In
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <Card
            key={idx}
            className="border shadow-sm rounded-xl overflow-hidden group hover:scale-[1.01] transition-all bg-white relative"
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full bg-${s.color}-500 opacity-20`}
            />
            <CardContent className="p-6">
              <div
                className={`h-10 w-10 rounded-xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-4`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                {s.label}
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {s.label.includes("Claims") ? (
                  <PrivacyMask value={s.val} />
                ) : (
                  s.val
                )}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between text-slate-900">
              Recent Attendance
              <ScanLine className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Oct {32 - i}, 2024
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Standard Shift
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900">
                        08:0{i} AM
                      </p>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight">
                        Time In
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900">
                        05:0{i} PM
                      </p>
                      <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-tight">
                        Time Out
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">
                Latest Payslip
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      Net Pay
                    </p>
                    <h4 className="text-xl font-black text-slate-900">
                      <PrivacyMask value="₱28,450.00" />
                    </h4>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg hover:bg-white text-slate-400"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-50 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Gross
                    </p>
                    <p className="text-xs font-black">
                      <PrivacyMask value="₱32,000" />
                    </p>
                  </div>
                  <div className="p-3 border border-slate-50 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      Deductions
                    </p>
                    <p className="text-xs font-black text-red-500">
                      <PrivacyMask value="₱3,550" />
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
            <CardContent className="p-6 relative">
              <h2 className="text-sm font-black mb-4 uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />{" "}
                Benefits Card
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-400 uppercase">
                    HMO Balance
                  </span>
                  <span className="text-emerald-400">
                    <PrivacyMask value="₱150,000 / ₱200,000" />
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-emerald-500 rounded-full" />
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed italic">
                  Premium coverage active until
                  Dec 2024. Next dental cleaning
                  available in 3 days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
