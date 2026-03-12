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
import Link from "next/link";

export default function AnalyticsDashboard() {
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
              HR Analytics
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            HR Analytics Dashboard
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Data insights & workforce intelligence
          </p>
        </div>

        <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-slate-100 uppercase tracking-widest text-[10px]">
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
            className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
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
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[40px] bg-white overflow-hidden h-[500px] flex flex-col items-center justify-center p-12 text-center group">
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

        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[40px] bg-indigo-600 text-white overflow-hidden p-10 flex flex-col justify-between group">
          <div>
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter leading-tight mb-4 italic">
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
            className="w-full h-14 rounded-2xl border-white/20 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest"
          >
            Deep Dive Analysis
          </Button>
        </Card>
      </div>
    </div>
  );
}
