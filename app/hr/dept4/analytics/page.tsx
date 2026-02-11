"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart3, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">HR Analytics Dashboard</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Metric {i}</p>
                                <p className="text-xl font-black text-slate-900">--</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden h-[400px] flex flex-col items-center justify-center">
                <LineChart className="h-20 w-20 text-blue-500 opacity-5 mb-4" />
                <p className="font-bold text-slate-300">Data visualization loading...</p>
            </Card>
        </div>
    );
}
