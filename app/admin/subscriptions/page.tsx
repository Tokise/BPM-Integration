"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminSubscriptionsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Subscriptions</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Manage seller plans & billing</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-[280px] hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search subscriptions..."
                            className="pl-11 h-12 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl font-bold text-xs focus-visible:ring-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Subs", value: "1,284", sub: "+12 this week" },
                    { label: "MRR", value: "₱450,000", sub: "+8.5% vs last month" },
                    { label: "Churn Rate", value: "1.2%", sub: "-0.4% improvement" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{stat.value}</h3>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{stat.sub}</p>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900">Current Subscriptions</CardTitle>
                        <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Active billing cycles for platform sellers</CardDescription>
                    </div>
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-slate-900" />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none px-4">
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6 pl-8">Seller / Shop</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">Plan</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">Next Billing</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6 pr-8 text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <TableCell className="py-6 pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 uppercase text-[11px] tracking-tight">Guillermo's Shop</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase italic">ID: #8294{i}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100">Premium Peak</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500 font-bold text-[11px]">Feb 28, 2026</TableCell>
                                    <TableCell className="pr-8 text-right font-black text-slate-900">₱2,499.00</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
