"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingDown, TrendingUp, DollarSign, PieChart, LineChart, BarChart } from "lucide-react";

export default function TCAOPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cost Analysis (TCAO)</h1>
                <p className="text-slate-500 font-medium">Optimize transportation costs through predictive analytics and expense monitoring.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Cost per Shipment", val: "$4.12", icon: DollarSign, tr: "down", change: "-8%" },
                    { label: "Fleet Efficiency", val: "92%", icon: TrendingUp, tr: "up", change: "+12%" },
                    { label: "Fuel Expenses", val: "$12,450", icon: Calculator, tr: "up", change: "+2%" },
                    { label: "Route Savings", val: "$3,110", icon: TrendingDown, tr: "down", change: "-15%" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <span className={`text-[10px] font-black uppercase ${stat.tr === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 mt-2">{stat.val}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-8">
                    <CardHeader className="p-0">
                        <CardTitle className="text-xl font-black">Expense Distribution</CardTitle>
                    </CardHeader>
                    <div className="aspect-[16/9] bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <PieChart className="h-12 w-12 opacity-20" />
                            <p className="text-xs font-bold font-mono">Chart View [Exp-Dist-01]</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-8">
                    <CardHeader className="p-0">
                        <CardTitle className="text-xl font-black">Efficiency Trend</CardTitle>
                    </CardHeader>
                    <div className="aspect-[16/9] bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <LineChart className="h-12 w-12 opacity-20" />
                            <p className="text-xs font-bold font-mono">Chart View [Eff-Trend-01]</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
