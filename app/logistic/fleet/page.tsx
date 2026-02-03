"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Truck, Filter, MapPin, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FleetPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Fleet & Transit</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Vehicle tracking & maintenance</p>
                </div>
                <Button className="rounded-xl font-bold gap-2">
                    <Truck className="h-4 w-4" />
                    Register Vehicle
                </Button>
            </div>

            <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
                    <CardTitle className="text-xl font-black">Active Fleet</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search vehicles..." className="pl-9 rounded-xl bg-slate-50 border-none h-10 font-bold text-sm" />
                        </div>
                        <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                            <Filter className="h-4 w-4 text-slate-500" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 border-none hover:bg-slate-50/50">
                                <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vehicle</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Driver</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fuel Level</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                                <TableHead className="pr-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { id: "T-22", driver: "Mike Ross", location: "Manila Hub", fuel: "85%", status: "In Transit" },
                                { id: "V-04", driver: "Harvey Specter", location: "Quezon City", fuel: "42%", status: "Loading" },
                                { id: "M-91", driver: "Louis Litt", location: "Makati Depo", fuel: "98%", status: "Standby" },
                                { id: "T-18", driver: "Donna Paulsen", location: "Pasig Route", fuel: "15%", status: "Needs Fuel" },
                            ].map((v, idx) => (
                                <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-slate-200 text-xs">
                                                {v.id}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 leading-none">Vehicle {v.id}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Plate: PH-{v.id}X</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-600">{v.driver}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                                            <MapPin className="h-3 w-3 text-primary" />
                                            {v.location}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        parseInt(v.fuel) < 20 ? "bg-rose-500" : "bg-primary"
                                                    )}
                                                    style={{ width: v.fuel }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400">{v.fuel}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-0.5 text-[9px] font-black uppercase rounded-md border",
                                            v.status === 'In Transit' && "bg-blue-50 text-blue-500 border-blue-100",
                                            v.status === 'Loading' && "bg-amber-50 text-amber-500 border-amber-100",
                                            v.status === 'Standby' && "bg-emerald-50 text-emerald-500 border-emerald-100",
                                            v.status === 'Needs Fuel' && "bg-rose-50 text-rose-500 border-rose-100"
                                        )}>
                                            {v.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase hover:text-primary">Track Live</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
