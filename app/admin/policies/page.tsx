"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Lock, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPoliciesPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col gap-2 mt-10">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Catalogue Policy</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Platform compliance & safety rules</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-100 bg-white p-10 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Lock className="h-40 w-40 rotate-12" />
                    </div>
                    <CardHeader className="px-0 pt-0">
                        <div className="h-14 w-14 bg-amber-50 rounded-[22px] flex items-center justify-center text-amber-500 mb-6 shadow-sm border border-amber-100">
                            <Shield className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Listing Verification</CardTitle>
                        <CardDescription className="font-bold text-slate-400 mt-2 leading-relaxed">Automated and manual checks for new product listings to ensure brand integrity.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 space-y-8 mt-4">
                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">AI Content Filtering</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">Status: <span className="text-emerald-500">ACTIVE</span></p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">Manual Review Threshold</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">Triggers at 3 high-risk keywords</p>
                            </div>
                        </div>
                        <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Update Requirements</Button>
                    </CardContent>
                </Card>

                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-100 bg-white p-10 overflow-hidden relative group">
                    <CardHeader className="px-0 pt-0">
                        <div className="h-14 w-14 bg-blue-50 rounded-[22px] flex items-center justify-center text-blue-500 mb-6 shadow-sm border border-blue-100">
                            <FileText className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Merchant Agreements</CardTitle>
                        <CardDescription className="font-bold text-slate-400 mt-2 leading-relaxed">Legal templates and terms of service for all platform participants.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4 mt-4">
                        {['Standard Seller Agreement v2.1', 'Global Logistics Partner T&C', 'Privacy Distribution Policy'].map((policy, i) => (
                            <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                                <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{policy}</span>
                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0">
                                    <FileText className="h-4 w-4 text-slate-300 group-hover:text-primary" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
