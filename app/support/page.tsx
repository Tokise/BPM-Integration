"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headset, MessageSquare, Phone, Mail, FileQuestion, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CustomerSupportPage() {
    return (
        <div className="max-w-6xl mx-auto py-12 px-4 space-y-16">
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Customer Protection Hub</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">How can we help you today?</h1>
                <p className="text-slate-500 font-medium max-w-xl mx-auto text-lg leading-relaxed">Search our help center for quick answers or get in touch with our 24/7 support experts.</p>

                <div className="max-w-2xl mx-auto pt-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Search for help... (e.g. 'Refund Policy', 'Delayed Shipping')" className="pl-12 h-14 rounded-2xl border-slate-200 focus:ring-primary shadow-lg border-2" />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Order Issues", desc: "Problems with delivery, items, or status tracking.", icon: MessageSquare },
                    { title: "Returns & Refunds", desc: "Start a return or check your refund status.", icon: FileQuestion },
                    { title: "My Account", desc: "Manage your profile, security, and addresses.", icon: Headset },
                    { title: "Payment Info", desc: "Help with vouchers, billing, and transactions.", icon: ShieldCheck },
                ].map((cat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-3xl hover:shadow-md transition-all group hover:-translate-y-1 bg-white cursor-pointer">
                        <CardContent className="p-8 space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <cat.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors">{cat.title}</h3>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{cat.desc}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white overflow-hidden relative">
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-black tracking-tight">Speak to a Human</h2>
                        <p className="text-slate-400 font-medium max-w-md">Our average response time is under 5 minutes. We're here to solve your problems 24/7.</p>

                        <div className="grid sm:grid-cols-2 gap-4 pt-4">
                            <Button className="h-14 rounded-2xl bg-primary text-black font-black hover:bg-amber-400 transition-all px-8 justify-start gap-3">
                                <MessageSquare className="h-5 w-5" /> Start Live Chat
                            </Button>
                            <Button variant="outline" className="h-14 rounded-2xl border-slate-700 text-white font-black hover:bg-slate-800 transition-all px-8 justify-start gap-3">
                                <Phone className="h-5 w-5" /> +1 (800) 123-4567
                            </Button>
                        </div>
                    </div>
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 h-64 w-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                </Card>

                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white border border-slate-100 p-8 flex flex-col justify-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Mail className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Email Support</h3>
                        <p className="text-sm font-medium text-slate-500">Expect a detailed response within 24 hours.</p>
                    </div>
                    <Button variant="link" className="text-primary font-black h-auto p-0 flex items-center justify-start group">
                        support@example.com <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Card>
            </div>
        </div>
    );
}
