"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Search, Filter, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OnboardingPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">New Hire Onboarding</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Manage employee integration and training</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                    <Rocket className="h-5 w-5" /> Start Onboarding
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 p-8">
                    <CardTitle className="text-xl font-black">Onboarding Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                            <UserCheck className="h-10 w-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No active onboarding</h3>
                        <p className="text-slate-500 font-medium max-w-xs mt-2">No new hires are currently in the onboarding stage.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
