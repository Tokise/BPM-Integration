"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Settings, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ESSPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Employee Self-Service</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Manage your personal information and settings</p>
                </div>
                <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-slate-200">
                    <Settings className="h-5 w-5 mr-2" /> Account Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
                    <CardHeader className="px-0 pt-0"><CardTitle className="text-xl font-black">Personal Info</CardTitle></CardHeader>
                    <CardContent className="px-0 pb-0 flex flex-col items-center py-10">
                        <div className="h-24 w-24 bg-slate-100 rounded-full mb-4" />
                        <p className="font-black text-slate-900">Employee Name</p>
                        <p className="text-sm font-bold text-slate-400">Software Engineer</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
                    <CardHeader className="px-0 pt-0"><CardTitle className="text-xl font-black">Security</CardTitle></CardHeader>
                    <CardContent className="px-0 pb-0 flex flex-col items-center py-10">
                        <Shield className="h-20 w-20 text-blue-500 opacity-20 mb-4" />
                        <Button className="bg-slate-900 text-white font-black rounded-xl">Change Password</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
