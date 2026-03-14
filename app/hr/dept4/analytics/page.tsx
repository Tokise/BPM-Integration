"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Search,
  Users,
  Clock,
  Briefcase,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { profile } = useUser();
  const pathname = usePathname();
  const userDeptCode = (profile?.departments as any)?.code;
  const isIntegratedHr = ["HR_DEPT1", "HR_DEPT2", "HR_DEPT3"].includes(userDeptCode); // Dept 4 is owner
  const baseUrl = userDeptCode === "HR_DEPT1" ? "/hr/dept1" : userDeptCode === "HR_DEPT2" ? "/hr/dept2" : userDeptCode === "HR_DEPT3" ? "/hr/dept3" : "/hr/dept4";

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
            value: "1,248",
          },
          {
            icon: Clock,
            label: "Avg Tenure",
            value: "3.2 yrs",
          },
          {
            icon: Briefcase,
            label: "Open Positions",
            value: "24",
          },
          {
            icon: Globe,
            label: "Diversity Rate",
            value: "68%",
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden h-[500px] flex flex-col items-center justify-center p-12 text-center group">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <LineChart className="h-10 w-10 text-indigo-500 opacity-20" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            Performance Trends
          </h3>
          <p className="text-sm font-bold text-slate-300 max-w-xs">
            Synchronizing real-time workforce data
            with the analytics engine...
          </p>
        </Card>

        <Card className="border border-slate-200 shadow-none rounded-lg bg-indigo-600 text-white overflow-hidden p-10 flex flex-col justify-between group">
          <div>
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-black tracking-tighter leading-tight mb-4 uppercase">
              Strategic Growth Forecast
            </h3>
            <p className="text-sm font-bold opacity-60 leading-relaxed mb-10">
              Based on current hiring velocity,
              the workforce is projected to
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
    </div>
  );
}
