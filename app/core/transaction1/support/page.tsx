"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headset, MessageSquare, Phone, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerSupportPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Customer Support</h1>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">We're here to help you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white text-center hover:scale-105 transition-transform cursor-pointer group">
                    <MessageSquare className="h-12 w-12 mx-auto text-primary group-hover:scale-110 transition-transform mb-4" />
                    <h3 className="font-black text-lg">Live Chat</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">Chat with our team 24/7</p>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white text-center hover:scale-105 transition-transform cursor-pointer group">
                    <Phone className="h-12 w-12 mx-auto text-blue-500 group-hover:scale-110 transition-transform mb-4" />
                    <h3 className="font-black text-lg">Call Us</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">Available Mon-Fri, 9am-6pm</p>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white text-center hover:scale-105 transition-transform cursor-pointer group">
                    <Mail className="h-12 w-12 mx-auto text-amber-500 group-hover:scale-110 transition-transform mb-4" />
                    <h3 className="font-black text-lg">Email Support</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">Response within 24 hours</p>
                </Card>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12">
                <CardTitle className="text-2xl font-black mb-6">Frequently Asked Questions</CardTitle>
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="pb-6 border-b border-slate-50 last:border-0">
                            <h4 className="font-bold text-slate-900 mb-2">How do I track my order?</h4>
                            <p className="text-sm text-slate-500">You can track your order by going to the 'Order Tracking' section in your profile...</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
