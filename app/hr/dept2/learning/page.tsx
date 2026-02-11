"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Play, Search, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LearningPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Learning Management</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Personalized training and development</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                    <Folder className="h-5 w-5" /> Course Catalog
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                    <GraduationCap className="h-16 w-16 text-blue-500 opacity-20 mb-6" />
                    <h3 className="text-2xl font-black text-slate-900">Your learning path is empty</h3>
                    <Button variant="link" className="text-amber-600 font-bold mt-2">Browse Courses</Button>
                </CardContent>
            </Card>
        </div>
    );
}
