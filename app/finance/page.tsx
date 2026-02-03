"use client";

import { DollarSign, CreditCard, TrendingUp, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinanceDashboard() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Finance Dashboard</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Financial Planning & Analysis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue", value: "₱1.2M", icon: DollarSign },
                    { label: "Expenses", value: "₱450K", icon: CreditCard },
                    { label: "Net Profit", value: "₱750K", icon: TrendingUp },
                    { label: "Budget Usage", value: "65%", icon: PieChart },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</CardTitle>
                            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-primary group-hover:text-black transition-colors">
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
