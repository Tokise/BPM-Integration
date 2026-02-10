"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSearch, Download, Share2, Archive, ShieldCheck, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DTRSPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Document Tracking (DTRS)</h1>
                    <p className="text-slate-500 font-medium">Securely track and retrieve logistics documents, permits, and waybills.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200 font-bold">Archive All</Button>
                    <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">Upload Document</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Files", val: "4,284", icon: Archive, color: "slate" },
                    { label: "Verified", val: "3,112", icon: ShieldCheck, color: "green" },
                    { label: "Pending Scan", val: "124", icon: Clock, color: "amber" },
                    { label: "Search Index", val: "100%", icon: FileSearch, color: "blue" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl bg-white border border-slate-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div className={`h-2 w-2 rounded-full ${stat.color === 'green' ? 'bg-green-500' : stat.color === 'amber' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 mt-2">{stat.val}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <div className="p-8 border-b border-slate-50 space-y-4">
                    <CardTitle className="text-xl font-black">Document Repository</CardTitle>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search by Document Name, ID, or Date..." className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium" />
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="space-y-0 divide-y divide-slate-50">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center gap-6 group">
                                <div className="h-14 w-11 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                                    <FileText className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                                    <span className="text-[8px] font-black text-slate-300 mt-1">PDF</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 leading-tight">WB-2026-X09{i}-MANILA-HUB</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Waybill • Uploaded by Admin • Feb 10, 2026</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-amber-50 rounded-xl">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-amber-50 rounded-xl">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" className="h-10 px-4 font-black text-[10px] text-slate-400 hover:text-primary hover:bg-amber-50 rounded-xl uppercase">Retrieve</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
