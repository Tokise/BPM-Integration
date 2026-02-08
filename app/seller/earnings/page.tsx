"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Download, PieChart, Banknote } from "lucide-react";

export default function SellerEarningsPage() {
    return (
        <div className="space-y-9 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Earnings</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Financial performance & payouts</p>
                </div>
                <Button className="bg-primary text-black font-black h-12 px-8 rounded-xl gap-2 shadow-lg shadow-primary/20">
                    <Download className="h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* Wallet Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-none bg-slate-900 text-white shadow-2xl shadow-slate-200 rounded-[32px] p-8 relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Balance</span>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-white tracking-tighter">₱142,450.00</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-emerald-400 flex items-center text-[10px] font-black">
                                    <ArrowUpRight className="h-3 w-3 mr-1" /> +₱12,500
                                </span>
                                <span className="text-slate-500 text-[10px] font-bold">Today</span>
                            </div>
                        </div>
                        <Button className="w-full h-12 bg-primary text-black font-black rounded-xl hover:scale-[1.02] transition-transform">
                            Withdraw to Bank
                        </Button>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
                </Card>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] bg-white p-8 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Growth</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">18.4%</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1">Revenue increase this month</p>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] bg-white p-8 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                <PieChart className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ads Spend</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">₱4,200.00</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1">Marketing efficiency: High</p>
                    </Card>
                </div>
            </div>

            {/* Payout History */}
            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl font-black">Recent Payouts</CardTitle>
                </CardHeader>
                <div className="space-y-6 mt-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                                    <Banknote className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">Payout #PAY-832{i}</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Oct {18 - i}, 2023 • Bank Transfer</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900">₱18,500.00</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Success</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
