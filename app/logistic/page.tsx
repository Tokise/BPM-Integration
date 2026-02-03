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
                    { label: "Active Shipments", value: "86", icon: Truck },
                    { label: "Warehouse Capacity", value: "82%", icon: Warehouse },
                    { label: "Pending Dispatches", value: "24", icon: Package },
                    { label: "Active Routes", value: "12", icon: MapPin },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</CardTitle>
                            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-primary group-hover:text-black transition-colors">
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
