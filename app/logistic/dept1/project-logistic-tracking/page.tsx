"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck, ChevronRight, Package, Search, Filter, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProjectLogisticTrackingPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Logistic Tracking</h1>
                    <p className="text-slate-500 font-medium">End-to-end monitoring for large-scale project materials and deployments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-xl h-11 border-slate-200 font-bold">Export Logs</Button>
                    <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">Create Project Hub</Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Enter Project ID or Shipment #" className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-medium" />
                </div>
                <Button variant="ghost" className="h-11 px-4 rounded-2xl text-slate-500 font-black">
                    <Filter className="h-4 w-4 mr-2" /> Quick Filter
                </Button>
            </div>

            <div className="grid gap-6">
                {[
                    { id: "PRJ-901", name: "Metro Network Expansion", status: "Ongoing", progress: 65 },
                    { id: "PRJ-902", name: "Smart City Infrastructure", status: "Stalled", progress: 12 },
                    { id: "PRJ-903", name: "Data Center Maintenance", status: "Near Completion", progress: 92 },
                ].map((prj, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group bg-white border border-slate-50">
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                    <Layers className="h-8 w-8 text-amber-600" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black text-slate-900">{prj.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase ${prj.status === 'Ongoing' ? 'bg-blue-50 text-blue-600' :
                                                prj.status === 'Stalled' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {prj.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{prj.id} • Active Hubs: 4</p>
                                </div>
                                <div className="w-full md:w-48 space-y-2">
                                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>Progress</span>
                                        <span>{prj.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${prj.progress}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <Truck className="h-4 w-4 text-slate-400" />
                                    <div className="text-xs font-bold text-slate-600">8 Units en-route</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Package className="h-4 w-4 text-slate-400" />
                                    <div className="text-xs font-bold text-slate-600">22 Items at Hub</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <div className="text-xs font-bold text-slate-600">Taguig Hub Depot</div>
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="link" className="text-primary font-black h-auto p-0 flex items-center group/btn">
                                        Full Details <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
