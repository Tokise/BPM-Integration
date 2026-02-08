"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings2, Truck, Warehouse, Globe, Zap, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogisticsConfigPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col gap-2 mt-10">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Logistics Config</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Global supply chain parameters</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white">
                    <CardHeader className="p-8 pb-4">
                        <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-sm border border-amber-100">
                            <Truck className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900">Delivery Rates</CardTitle>
                        <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Configure base shipping fees</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Standard (₱)</Label>
                                <Input placeholder="45.00" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Express (₱)</Label>
                                <Input placeholder="120.00" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Free Shipping Threshold (₱)</Label>
                            <Input placeholder="2500.00" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                        </div>
                        <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center gap-2">
                            <Save className="h-4 w-4" /> Save Logistics Params
                        </Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white">
                    <CardHeader className="p-8 pb-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-sm border border-blue-100">
                            <Warehouse className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900">Warehouse Integration</CardTitle>
                        <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">API & webhook connections</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Webhook URL</Label>
                            <Input placeholder="https://logistics.partner/api/webhook" className="rounded-xl bg-slate-50 border-none h-12 font-bold focus-visible:ring-primary" />
                        </div>
                        <div className="p-6 bg-slate-900 rounded-[28px] border border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Connection Active</span>
                                </div>
                                <Zap className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                Last sync: 2 minutes ago. All systems are operating normally across 4 regional hubs.
                            </p>
                        </div>
                        <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] border-slate-200">
                            Test Connection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
