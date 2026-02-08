"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, MapPin, ShieldCheck, Zap, Layers, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SellerShippingPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Shipping Settings</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Configure carriers and delivery options</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Carriers */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-8">
                    <CardHeader className="px-0 pt-0 mb-6">
                        <CardTitle className="text-xl font-black">Active Carriers</CardTitle>
                    </CardHeader>
                    <div className="space-y-6">
                        {[
                            { name: "ANEC Express", desc: "Our internal premium delivery service", icon: Zap, active: true },
                            { name: "Global Logistics", desc: "Reliable international shipping partner", icon: Truck, active: true },
                            { name: "Standard Mail", desc: "Economical choice for non-urgent items", icon: Layers, active: false }
                        ].map((carrier, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-primary/50 transition-colors">
                                <div className="flex gap-6 items-center">
                                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                        <carrier.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900">{carrier.name}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{carrier.desc}</p>
                                    </div>
                                </div>
                                <Switch checked={carrier.active} />
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Delivery Options */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white p-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Settings2 className="h-5 w-5 text-primary" />
                                <h3 className="font-black text-slate-900">Preferences</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-600">Free Shipping over ₱1000</Label>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-600">Same Day Delivery</Label>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-600">International Shipping</Label>
                                    <Switch />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-slate-900 p-8 text-white group overflow-hidden relative">
                        <div className="relative z-10 space-y-4">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-black">Shipping Protection</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Ensure your items reach their destination safely with our premium insurance plan.</p>
                            <Button className="w-full bg-primary text-black font-black rounded-xl">Upgrade Protection</Button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
