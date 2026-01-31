"use client";

import {
    Truck,
    Warehouse,
    Ship,
    Package,
    Navigation,
    MoreHorizontal,
    Search,
    Plus,
    Box,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const vehicles = [
    { id: "VEH-001", plate: "NG-7742", type: "Heavy Truck", status: "in_transit", driver: "A. Santos", load: "92%" },
    { id: "VEH-002", plate: "NG-1120", type: "Van", status: "available", driver: "M. dela Cruz", load: "0%" },
    { id: "VEH-003", plate: "NG-9981", type: "Motorcycle", status: "delivering", driver: "J. Reyes", load: "14%" },
    { id: "VEH-004", plate: "NG-4456", type: "Heavy Truck", status: "maintenance", driver: "N/A", load: "0%" },
];

const warehouses = [
    { name: "Metro Manila Hub", code: "WH-MNL", capacity: 85000, used: 72250, location: "Quezon City" },
    { name: "Cebu Regional Center", code: "WH-CEB", capacity: 45000, used: 12000, location: "Mandaue" },
    { name: "Davao Logistics Node", code: "WH-DVO", capacity: 30000, used: 28500, location: "Sasa" },
];

export default function LogisticsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Logistics</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Smart Supply Chain & Fleet Management</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl font-bold h-12 px-6 border-slate-200">
                        <Box className="h-4 w-4 mr-2" /> View Inventory
                    </Button>
                    <Button className="bg-primary text-black font-black h-12 px-8 rounded-2xl shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4 mr-2" /> New Dispatch
                    </Button>
                </div>
            </div>

            {/* Warehouse Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {warehouses.map((wh, idx) => {
                    const percentage = Math.round((wh.used / wh.capacity) * 100);
                    return (
                        <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Warehouse className="h-20 w-20" />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{wh.code}</span>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-[10px] font-bold text-slate-400">{wh.location}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">{wh.name}</h3>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-500">Capacity Utilization</span>
                                        <span className={cn(
                                            "text-lg font-black",
                                            percentage > 80 ? "text-red-500" : "text-slate-900"
                                        )}>{percentage}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-1000 ease-out",
                                                percentage > 80 ? "bg-red-500" : "bg-primary"
                                            )}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-1">
                                        <span>{wh.used.toLocaleString()} units used</span>
                                        <span>{wh.capacity.toLocaleString()} total</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Fleet & Transit */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Fleet List */}
                <Card className="xl:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">Fleet Operations</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Active Vehicles & Couriers</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input className="h-10 w-48 rounded-xl bg-slate-50 border-none pl-10 focus-visible:ring-1" placeholder="Search vehicle..." />
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50">
                                <MoreHorizontal className="h-5 w-5 text-slate-500" />
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Vehicle / Pilot</th>
                                    <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Type</th>
                                    <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Status</th>
                                    <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Cargo Load</th>
                                    <th className="text-right py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {vehicles.map((v) => (
                                    <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center relative">
                                                    <Truck className="h-5 w-5 text-slate-400" />
                                                    <div className={cn(
                                                        "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
                                                        v.status === 'in_transit' ? "bg-green-500" :
                                                            v.status === 'maintenance' ? "bg-red-500" : "bg-slate-300"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{v.plate}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{v.driver}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-2">
                                            <span className="text-xs font-bold text-slate-600">{v.type}</span>
                                        </td>
                                        <td className="py-5 px-2">
                                            <div className="flex items-center gap-2">
                                                {v.status === 'in_transit' && <Clock className="h-3 w-3 text-green-500" />}
                                                {v.status === 'maintenance' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                                {v.status === 'available' && <CheckCircle2 className="h-3 w-3 text-slate-400" />}
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    v.status === 'in_transit' ? "text-green-600" :
                                                        v.status === 'maintenance' ? "text-red-500" : "text-slate-500"
                                                )}>
                                                    {v.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-400" style={{ width: v.load }} />
                                                </div>
                                                <span className="text-[10px] font-black">{v.load}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-2 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-md transition-all">
                                                <Navigation className="h-4 w-4 text-primary" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Transit Pulse */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 bg-slate-950 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <h4 className="text-xl font-black mb-6">Real-time Performance</h4>
                        <div className="space-y-8">
                            {[
                                { label: "Ontime Delivery Rate", val: "94.2%", color: "text-primary" },
                                { label: "Average Transit Time", val: "1.4 Days", color: "text-blue-400" },
                                { label: "Fuel Efficiency Index", val: "8.8/10", color: "text-emerald-400" },
                            ].map((p, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.label}</span>
                                    <span className={cn("text-3xl font-black tracking-tighter", p.color)}>{p.val}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 bg-white overflow-hidden">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            System Alerts
                        </h4>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-red-900 uppercase tracking-tight">Main Hub Capacity High</p>
                                    <p className="text-[10px] text-red-700 font-medium leading-relaxed mt-1">
                                        Metro Manila Hub is currently at 92% capacity. Consider routing new inbound freight to Cebu or Davao regional centers.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex gap-3">
                                <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-orange-900 uppercase tracking-tight">Vehicle Maintenance Due</p>
                                    <p className="text-[10px] text-orange-700 font-medium leading-relaxed mt-1">
                                        VEH-004 (NG-4456) has exceeded service hours. Scheduled for maintenance at 04:00 PM today.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
