"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Banknote, DollarSign, PieChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PayrollPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Payroll Management</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Process and track employee compensation</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 shadow-lg shadow-amber-200">
                    Run Payroll Cycle
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white overflow-hidden">
                    <CardHeader className="px-0 pt-0"><CardTitle className="text-xl font-black">Current Period</CardTitle></CardHeader>
                    <CardContent className="px-0 py-6 flex flex-col items-center">
                        <Wallet className="h-16 w-16 text-amber-500 opacity-20 mb-4" />
                        <p className="text-3xl font-black text-slate-900">₱0.00</p>
                        <p className="text-sm font-bold text-slate-400 mt-1">Estimated Total Payout</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white overflow-hidden text-center flex flex-col items-center justify-center">
                    <FileText className="h-12 w-12 text-slate-200 mb-4" />
                    <p className="font-bold text-slate-400">Generate Payslips</p>
                </Card>
            </div>
        </div>
    );
}
