"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Calendar, ChevronRight, Clock, MapPin, Truck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VRDSPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vehicle Reservation (VRDS)</h1>
                    <p className="text-slate-500 font-medium">Coordinate vehicle dispatch and manage driver schedules.</p>
                </div>
                <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" /> Book Reservation
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <CardTitle className="text-xl font-black px-2">Upcoming Dispatches</CardTitle>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group bg-white">
                            <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                                <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                                    <Clock className="h-8 w-8 text-amber-600" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-900">RES-09{i}Z - Metro Manila Delivery</span>
                                        <span className={`px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase`}>Scheduled</span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-slate-400" /> Tomorrow, 8:00 AM
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Truck className="h-4 w-4 text-slate-400" /> Van #041
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-slate-400" /> Quezon City Hub
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-amber-50 transition-all">
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6">
                    <CardTitle className="text-xl font-black px-2">Availability</CardTitle>
                    <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
                        <div className="space-y-6">
                            {[
                                { label: "Salcedo Hub", val: 80, color: "green" },
                                { label: "Cebu Hub", val: 45, color: "amber" },
                                { label: "Davao Hub", val: 12, color: "red" },
                            ].map((hub, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>{hub.label} Vehicles</span>
                                        <span className={`text-${hub.color}-600`}>{hub.val}% Available</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full bg-${hub.color}-500`} style={{ width: `${hub.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
