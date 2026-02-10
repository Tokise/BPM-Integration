"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Signal, Battery, Map, Lock, Zap, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FleetAppPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Smartphone className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Command App</h1>
                    <p className="text-slate-500 font-medium">Remote interface for driver communication and mobile fleet tracking.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="flex justify-center">
                    {/* Mock Phone UI */}
                    <div className="w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden relative p-4 flex flex-col gap-4">
                        <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto my-1" />
                        <div className="flex justify-between items-center px-4 text-white">
                            <span className="text-[10px] font-black tracking-tighter">9:41 AM</span>
                            <div className="flex items-center gap-2">
                                <Signal className="h-3 w-3" />
                                <Battery className="h-3 w-3" />
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl flex-1 p-4 space-y-4 overflow-hidden relative">
                            <div className="h-24 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                <Map className="h-8 w-8 opacity-40" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                                <div className="h-4 w-1/2 bg-slate-200 rounded" />
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                <div className="h-10 w-full bg-slate-900 rounded-xl" />
                                <div className="h-10 w-full bg-primary rounded-xl" />
                            </div>
                        </div>
                        <div className="h-1 w-20 bg-slate-800 rounded-full mx-auto mt-2" />
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900">Mobile Features</h3>
                        <p className="text-slate-500 font-medium">Download the driver app or use the responsive web companion.</p>
                    </div>

                    <div className="grid gap-4">
                        {[
                            { title: "Real-time Dispatch", desc: "Instant task push notifications", icon: Zap },
                            { title: "Geo-Fencing", desc: "Automated hub entry/exit logs", icon: MapPin },
                            { title: "Proof of Delivery", desc: "Photo and signature capture", icon: Lock },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-50 group hover:border-primary/20 transition-all">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button className="flex-1 bg-slate-900 text-white rounded-xl h-11 font-black">App Store</Button>
                        <Button className="flex-1 bg-slate-900 text-white rounded-xl h-11 font-black">Play Store</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
