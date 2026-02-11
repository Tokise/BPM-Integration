"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, DollarSign, Search, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClaimsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Claims & Reimbursement</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Process employee financial claims</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                    <Receipt className="h-5 w-5" /> Submit Claim
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50"><CardTitle className="text-xl font-black">Pending Claims</CardTitle></CardHeader>
                <CardContent className="p-12 flex flex-col items-center">
                    <DollarSign className="h-16 w-16 text-emerald-500 opacity-20 mb-6" />
                    <h3 className="text-xl font-black text-slate-900">Zero pending claims</h3>
                    <p className="text-slate-500 font-medium mt-1">All claims have been settled.</p>
                </CardContent>
            </Card>
        </div>
    );
}
