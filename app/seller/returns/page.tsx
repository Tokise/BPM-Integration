"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RotateCcw, AlertTriangle, MessageCircle, MoreVertical } from "lucide-react";

export default function SellerReturnsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Returns & Refunds</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Manage disputes and product returns</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {[1, 2].map((i) => (
                    <Card key={i} className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="h-24 w-24 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shrink-0">
                                <RotateCcw className="h-10 w-10 text-rose-300" />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Return Request #RET-821{i}</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Order ID: #ORD-942{i}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-100">Pending Review</span>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
                                    "The item arrived with a small crack on the screen. I would like a replacement or full refund."
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                                    <Button className="bg-primary text-black font-black h-11 px-8 rounded-xl shadow-lg shadow-primary/20">Accept Return</Button>
                                    <Button variant="outline" className="h-11 px-8 rounded-xl border-slate-200 font-bold">Reject Request</Button>
                                    <Button variant="ghost" className="h-11 px-6 rounded-xl text-slate-400 gap-2 font-bold">
                                        <MessageCircle className="h-4 w-4" /> Chat with Buyer
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl min-w-[200px]">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Impact</span>
                                </div>
                                <p className="text-xl font-black text-slate-900">-₱2,450.00</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projected Loss</p>
                            </div>
                        </div>
                    </Card>
                ))}

                {/* Empty State Mockup */}
                <Card className="border-none shadow-xl shadow-slate-100 rounded-[32px] bg-slate-50/50 border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-6">
                        <RotateCcw className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">All caught up!</h3>
                    <p className="text-slate-500 mt-2 max-w-xs">No pending return requests. Great job maintainting product quality!</p>
                </Card>
            </div>
        </div>
    );
}
