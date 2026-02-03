"use client";

import {
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    ShoppingBag,
    DollarSign,
    Truck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Dashboard</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Platform Overview & Metrics</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue", value: "₱1,245,600", change: "+12.5%", icon: DollarSign, trend: "up" },
                    { label: "Active Orders", value: "342", change: "+8.2%", icon: ShoppingBag, trend: "up" },
                    { label: "Total Users", value: "2,840", change: "-2.4%", icon: Users, trend: "down" },
                    { label: "Active Shipments", value: "86", change: "+18.1%", icon: Truck, trend: "up" },
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
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-black uppercase">
                                {stat.trend === 'up' ? (
                                    <span className="text-green-500 flex items-center">
                                        <ArrowUpRight className="h-3 w-3 mr-1" /> {stat.change}
                                    </span>
                                ) : (
                                    <span className="text-red-500 flex items-center">
                                        <ArrowDownRight className="h-3 w-3 mr-1" /> {stat.change}
                                    </span>
                                )}
                                <span className="text-slate-400">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activities */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl font-black">Recent Orders</CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-50 hover:border-primary/20 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                                        #OR
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Order #ORD-824{i}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">2 items • ₱{(2450 * i).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black uppercase rounded-lg border border-blue-100">To Ship</span>
                                    <ArrowUpRight className="h-4 w-4 text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Logistics Pulse */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 bg-white">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            Logistics Pulse
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <span>Warehouse Capacity</span>
                                <span className="text-primary">82%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[82%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <span>Fleet Utilization</span>
                                <span className="text-blue-400">65%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-[65%]" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Fleet</p>
                            <div className="flex flex-wrap gap-2">
                                {['T-22', 'V-04', 'M-91', 'T-18', 'V-20'].map(v => (
                                    <span key={v} className="px-2 py-1 bg-slate-900 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-800">{v}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
