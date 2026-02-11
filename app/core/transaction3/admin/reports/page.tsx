"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, FileText, PieChart, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Reports & Admin</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Platform-wide reporting and oversight</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white hover:translate-y-[-4px] transition-transform">
                        <FileText className="h-10 w-10 text-slate-200 mb-4" />
                        <h3 className="font-black text-lg">Sales Audit {i}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1">Generated daily at 12:00 AM</p>
                        <Button variant="link" className="p-0 text-amber-600 font-bold mt-4">Download PDF</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
