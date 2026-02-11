"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Search, Filter, GraduationCap, School, TrendingUp, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompetencyPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Competency Management</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Map and assess employee skills</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                    <Brain className="h-5 w-5" /> Skill Assessment
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black">Competency Matrix</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pb-12 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6">
                        <Brain className="h-10 w-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No competency data</h3>
                    <p className="text-slate-500 font-medium max-w-xs mt-2">Initialize your skills matrix to start tracking competencies.</p>
                </CardContent>
            </Card>
        </div>
    );
}
