"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark, ArrowUpRight, Clock, CheckCircle2, DollarSign, Search } from "lucide-react";
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

export default function AdminPayoutsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Payout Management</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Settlements & financial disbursements</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-[280px] hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search payouts..."
                            className="pl-11 h-12 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl font-bold text-xs focus-visible:ring-primary"
                        />
                    </div>
                    <Button className="bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] px-6 h-12 rounded-2xl shadow-xl shadow-emerald-500/20">
                        Process Batches
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Pending Payouts", value: "₱84,200", icon: Clock },
                    { label: "Settled Today", value: "₱125,900", icon: CheckCircle2 },
                    { label: "Reserve Fund", value: "₱1.2M", icon: Landmark },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden flex items-start justify-between group">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                        </div>
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-all">
                            <stat.icon className="h-5 w-5" />
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900">Payout History</CardTitle>
                        <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Status of disbursements to sellers</CardDescription>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none px-4">
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6 pl-8">Batch ID</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">Recipient Shop</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6">Method</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-6 pr-8 text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="py-6 pl-8 font-bold text-slate-500 text-[11px]">#PAY-992{i}</TableCell>
                                    <TableCell>
                                        <span className="font-black text-slate-900 uppercase text-[11px] tracking-tight">Urban Bag Official</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border ${i % 2 === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {i % 2 === 0 ? 'Settled' : 'In Progress'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500 font-black text-[10px] uppercase tracking-tighter">GCash / Instapay</TableCell>
                                    <TableCell className="pr-8 text-right font-black text-slate-900">₱{(12400 + i * 500).toLocaleString()}.00</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
