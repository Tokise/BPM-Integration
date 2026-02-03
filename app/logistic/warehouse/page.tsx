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
import { Search, Warehouse, Filter, Package, Box, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WarehousePage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Warehousing</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Inventory & Storage Management</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold gap-2">
                        <Box className="h-4 w-4" />
                        Audit Stacks
                    </Button>
                    <Button className="rounded-xl font-bold gap-2">
                        <Package className="h-4 w-4" />
                        Receive Goods
                    </Button>
                </div>
            </div>

            <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
                    <CardTitle className="text-xl font-black">Stock Inventory</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search inventory..." className="pl-9 rounded-xl bg-slate-50 border-none h-10 font-bold text-sm" />
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
                                <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Item Name</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">SKU</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Storage Zone</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Stock Level</TableHead>
                                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Condition</TableHead>
                                <TableHead className="pr-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { name: "Ergonomic Office Chair", sku: "FUR-CH-001", zone: "Zone A-12", stock: 142, condition: "Excellent" },
                                { name: "Gaming Mouse Pro", sku: "ELE-MS-004", zone: "Zone C-05", stock: 24, condition: "Good" },
                                { name: "Mechanical Keyboard", sku: "ELE-KB-012", zone: "Zone C-08", stock: 8, condition: "Low Stock" },
                                { name: "Standing Desk", sku: "FUR-DS-019", zone: "Zone A-01", stock: 56, condition: "Excellent" },
                            ].map((item, idx) => (
                                <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                                <Box className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 leading-none">{item.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ref: {item.sku.split('-')[1]}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-400 text-xs">{item.sku}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-slate-500 font-black text-[10px] uppercase">
                                            <MapPin className="h-3 w-3 text-primary" />
                                            {item.zone}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-black text-sm",
                                                item.stock < 10 ? "text-rose-500" : "text-slate-900"
                                            )}>{item.stock}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">units</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-0.5 text-[9px] font-black uppercase rounded-md border",
                                            item.condition === 'Excellent' && "bg-emerald-50 text-emerald-500 border-emerald-100",
                                            item.condition === 'Good' && "bg-blue-50 text-blue-500 border-blue-100",
                                            item.condition === 'Low Stock' && "bg-rose-50 text-rose-500 border-rose-100"
                                        )}>
                                            {item.condition}
                                        </span>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase hover:text-primary">Manage</Button>
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
