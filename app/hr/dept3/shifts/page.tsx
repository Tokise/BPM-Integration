"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShiftsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Shift and Schedule</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Organize and assign work shifts</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                    <Plus className="h-5 w-5" /> New Schedule
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50"><CardTitle className="text-xl font-black">Shift Planner</CardTitle></CardHeader>
                <CardContent className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                    <Calendar className="h-20 w-20 text-slate-100 mb-6" />
                    <p className="font-bold text-slate-400">Pick a date to start scheduling shifts.</p>
                </CardContent>
            </Card>
        </div>
    );
}
