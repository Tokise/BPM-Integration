"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, TrendingUp, Target, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PerformancePage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Performance Management</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Evaluate and track employee growth</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                    <Target className="h-5 w-5" /> Set Review Cycle
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Review {i}</p>
                                <p className="text-xl font-black text-slate-900">Pending</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="p-8"><CardTitle className="text-xl font-black">Performance Reports</CardTitle></CardHeader>
                <CardContent className="p-8 flex items-center justify-center min-h-[300px] text-slate-400 font-bold">
                    No reports available for this period.
                </CardContent>
            </Card>
        </div>
    );
}
