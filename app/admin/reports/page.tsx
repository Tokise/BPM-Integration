"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, ShoppingBag, Download, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Reports & Admin</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Platform analytics & system health</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-bold uppercase tracking-widest text-[10px] gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Last 30 Days
                    </Button>
                    <Button className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 h-12 rounded-2xl shadow-xl shadow-slate-900/20 gap-2">
                        <Download className="h-4 w-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Gross Sales", value: "₱4.2M", icon: TrendingUp, color: "text-emerald-500" },
                    { label: "Active Sellers", value: "142", icon: Users, color: "text-blue-500" },
                    { label: "Total Products", value: "2,840", icon: ShoppingBag, color: "text-amber-500" },
                    { label: "Conversion Rate", value: "3.4%", icon: BarChart3, color: "text-purple-500" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[40px] p-10 bg-white">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Platform Performance</CardTitle>
                        <CardDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mt-2">Historical sales volume and growth metrics</CardDescription>
                    </CardHeader>
                    <div className="h-[300px] w-full bg-slate-50 rounded-[32px] mt-8 flex flex-col items-center justify-center border border-dashed border-slate-200">
                        <BarChart3 className="h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest italic">Chart visualization engine loading...</p>
                    </div>
                </Card>

                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[40px] p-8 bg-slate-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <TrendingUp className="h-20 w-20" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Quick Insights</h4>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                    <span>System Health</span>
                                    <span className="text-emerald-400">99.9%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full">
                                    <div className="h-full bg-emerald-400 w-[99.9%] rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                    <span>API Latency</span>
                                    <span className="text-amber-400">124ms</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full">
                                    <div className="h-full bg-amber-400 w-[65%] rounded-full" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[40px] p-8 bg-white">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Latest Reports</h4>
                        <div className="space-y-4">
                            {[
                                'Monthly Sales Audit - Jan 2026',
                                'Logistics Efficiency Breakdown',
                                'Seller Compliance Summary'
                            ].map((report, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                                    <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{report}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
