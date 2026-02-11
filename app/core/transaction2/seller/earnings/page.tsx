"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Landmark, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EarningsDashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Earnings Dashboard</h1>
                </div>
                <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-slate-200">
                    <Download className="h-5 w-5 mr-2" /> Export Report
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-slate-900 text-white overflow-hidden">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Balance</p>
                    <p className="text-4xl font-black mt-2">₱0.00</p>
                    <div className="mt-6">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl">Withdraw Funds</Button>
                    </div>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sales (30 Days)</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">₱0.00</p>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Commission Paid</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">₱0.00</p>
                </Card>
            </div>
        </div>
    );
}
