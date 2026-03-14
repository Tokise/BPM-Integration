"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Clock,
  Briefcase,
  Globe,
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function AnalyticsDashboard() {
  const supabase = createClient();
  const { profile } = useUser();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({
    headcountTrend: [],
    deptDistribution: [],
  });
  const [stats, setStats] = useState({
    totalHeadcount: 0,
    avgTenure: "0 yrs",
    openPositions: 0,
    diversityRate: "0%",
  });

  const userDeptCode = (profile?.departments as any)?.code;
  const isIntegratedHr = ["HR_DEPT1", "HR_DEPT2", "HR_DEPT3"].includes(
    userDeptCode
  );
  const baseUrl =
    userDeptCode === "HR_DEPT1"
      ? "/hr/dept1"
      : userDeptCode === "HR_DEPT2"
        ? "/hr/dept2"
        : userDeptCode === "HR_DEPT3"
          ? "/hr/dept3"
          : "/hr/dept4";

  useEffect(() => {
    if (!isIntegratedHr) {
      fetchAnalytics();
    }
  }, [profile?.id]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Headcount
      const { data: profiles } = await supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("id, created_at, department_id, departments(name)")
        .not("role", "in", '("customer","seller")');

      if (profiles) {
        setStats((prev) => ({
          ...prev,
          totalHeadcount: profiles.length,
          avgTenure: "1.4 yrs", // Mocked for now
          openPositions: 12,
          diversityRate: "42%",
        }));

        // Group by Month for Trend
        const months = Array.from({ length: 6 }).map((_, i) => {
          const d = subMonths(new Date(), 5 - i);
          return format(d, "MMM");
        });

        const trend = months.map((m, i) => {
          // Simulation of growth
          return {
            name: m,
            headcount: Math.floor(profiles.length * (0.8 + 0.2 * (i / 5))),
          };
        });

        // Department Distribution
        const depts: Record<string, number> = {};
        profiles.forEach((p) => {
          const name = (p.departments as any)?.[0]?.name || (p.departments as any)?.name || "Other";
          depts[name] = (depts[name] || 0) + 1;
        });

        const dist = Object.entries(depts).map(([name, value]) => ({
          name,
          value,
        }));

        setAnalyticsData({
          headcountTrend: trend,
          deptDistribution: dist,
        });
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  if (isIntegratedHr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center space-y-4">
        <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
          <Globe className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase">Access Restricted</h2>
        <p className="text-sm font-bold text-slate-400 max-w-sm uppercase tracking-widest leading-relaxed">
          Cross-departmental strategic analytics are currently restricted to HR Department 4 administrators.
        </p>
        <Link href={baseUrl}>
          <Button variant="outline" className="mt-4 rounded-lg font-black uppercase text-[10px] tracking-widest">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/hr/dept4">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              HR Analytics
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            HR Analytics Dashboard
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Data insights & workforce intelligence
          </p>
        </div>

        <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px]">
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Users,
            label: "Total Headcount",
            value: stats.totalHeadcount.toLocaleString(),
          },
          {
            icon: Clock,
            label: "Avg Tenure",
            value: stats.avgTenure,
          },
          {
            icon: Briefcase,
            label: "Open Positions",
            value: stats.openPositions,
          },
          {
            icon: Globe,
            label: "Diversity Rate",
            value: stats.diversityRate,
          },
        ].map((item, i) => (
          <Card
            key={i}
            className="border border-slate-200 shadow-none rounded-lg p-8 bg-white overflow-hidden group transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
                <item.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-slate-200 shadow-none rounded-xl bg-white overflow-hidden p-8 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Headcount Growth Trend
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" /> +12.5%
            </div>
          </div>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.headcountTrend}>
                <defs>
                  <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700}}
                />
                <ReTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="headcount" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHeadcount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-xl bg-white overflow-hidden p-8 flex flex-col h-[400px]">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">
            Departmental Distribution
          </h3>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={analyticsData.deptDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.deptDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

        <Card className="border border-slate-200 shadow-none rounded-lg bg-indigo-600 text-white overflow-hidden p-10 flex flex-col justify-between group">
          <div>
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tighter leading-tight mb-4 uppercase">
              Strategic Growth Forecast
            </h3>
            <p className="text-sm font-bold opacity-60 leading-relaxed mb-10">
              Based on current hiring velocity, the workforce is projected to
              increase by 15% next quarter.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full h-12 rounded-lg border-white/20 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest"
          >
            Deep Dive Analysis
          </Button>
        </Card>
    </div>
  );
}
