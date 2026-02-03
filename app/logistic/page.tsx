"use client";

import { Truck, Warehouse, Package, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogisticDashboard() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Logistics Dashboard</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Supply Chain & Fleet Operations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Active Shipments", value: "86", change: "+12", trend: "up", icon: Truck },
                    { label: "Warehouse Capacity", value: "82%", change: "-2%", trend: "down", icon: Warehouse },
                    { label: "Pending Dispatches", value: "24", change: "+5", trend: "up", icon: Package },
                    { label: "Active Routes", value: "12", change: "Stable", trend: "up", icon: MapPin },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-300 p-6 bg-white">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-sm border border-slate-100">
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            {stat.trend === 'up' ? (
                                <span className="text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-lg">
                                    {stat.change} today
                                </span>
                            ) : (
                                <span className="text-amber-500 flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                                    {stat.change} today
                                </span>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
