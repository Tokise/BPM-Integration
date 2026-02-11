"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, TrendingUp, DollarSign, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompensationPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Compensation Planning</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Strategy and budget for workforce rewards</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200 px-6">
                    View Budget
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardContent className="p-12 text-center text-slate-400 font-bold flex flex-col items-center">
                    <PieChart className="h-16 w-16 mb-4 opacity-10" />
                    Compensation summaries will appear here once processed.
                </CardContent>
            </Card>
        </div>
    );
}
