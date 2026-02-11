"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Scale, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PoliciesPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Catalogue Policy</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Enforce platform rules and standards</p>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center">
                <Scale className="h-16 w-16 text-slate-100 mb-6" />
                <h3 className="text-xl font-black text-slate-900">Governance Controls</h3>
                <p className="text-slate-500 font-bold mt-2">System policies are currently active.</p>
                <Button className="mt-8 bg-slate-900 text-white font-black rounded-xl h-11 px-8">Audit Logs</Button>
            </Card>
        </div>
    );
}
