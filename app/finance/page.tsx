"use client";

import {
  DollarSign,
  CreditCard,
  TrendingUp,
  PieChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FinanceDashboard() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Finance Dashboard
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Financial Planning & Analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue",
            value: "₱1.2M",
            change: "+15%",
            trend: "up",
            icon: DollarSign,
          },
          {
            label: "Expenses",
            value: "₱450K",
            change: "+2%",
            trend: "down",
            icon: CreditCard,
          },
          {
            label: "Net Profit",
            value: "₱750K",
            change: "+8%",
            trend: "up",
            icon: TrendingUp,
          },
          {
            label: "Budget Usage",
            value: "65%",
            change: "-5%",
            trend: "up",
            icon: PieChart,
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-300 p-6 bg-white"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {stat.value}
                </h3>
              </div>
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-sm border border-slate-100">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              {stat.trend === "up" ? (
                <span className="text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-lg">
                  {stat.change} vs LT
                </span>
              ) : (
                <span className="text-rose-500 flex items-center bg-rose-50 px-2 py-1 rounded-lg">
                  {stat.change} vs LT
                </span>
              )}
              <span className="text-slate-300">
                Forecasting stable
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
