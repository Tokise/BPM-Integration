"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, AlertCircle, Search, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReturnsWorkflowPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Returns Workflow</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Manage refund and return requests</p>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50"><CardTitle className="text-xl font-black">Return Requests</CardTitle></CardHeader>
                <CardContent className="p-12 text-center flex flex-col items-center">
                    <div className="h-20 w-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
                        <RotateCcw className="h-10 w-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No return requests</h3>
                    <p className="text-slate-500 font-bold mt-1">Excellent! No pending returns or disputes.</p>
                </CardContent>
            </Card>
        </div>
    );
}
