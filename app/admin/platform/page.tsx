"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, Shield, Zap, Save } from "lucide-react";

export default function PlatformControlPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Platform Control</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Global system & configuration</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white">
                    <CardHeader>
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                            <Globe className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-black">General Logistics</CardTitle>
                        <CardDescription className="font-bold text-slate-400">Manage global shipping and logistics parameters.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Default Shipping Cost (₱)</Label>
                            <Input placeholder="50.00" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Free Shipping Threshold (₱)</Label>
                            <Input placeholder="2500.00" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                        </div>
                        <Button className="w-full rounded-xl font-black h-12 gap-2">
                            <Save className="h-4 w-4" />
                            Update Logistics
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white">
                    <CardHeader>
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                            <Shield className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-black">Security & Access</CardTitle>
                        <CardDescription className="font-bold text-slate-400">Configure administrative access levels and logs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Session Timeout (Minutes)</Label>
                            <Input placeholder="60" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-2 text-slate-400">
                            <p className="text-[11px] font-bold leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                                Administrative logs are stored for 90 days by default. To extend this, please contact the system architect.
                            </p>
                        </div>
                        <Button variant="outline" className="w-full rounded-xl font-black h-12 gap-2 border-slate-200">
                            <Zap className="h-4 w-4 text-amber-500" />
                            View Access Logs
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
