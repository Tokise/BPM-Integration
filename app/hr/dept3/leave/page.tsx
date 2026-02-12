"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plane,
  CalendarCheck,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeavePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Leave Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage employee vacations and absences
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
          <Plus className="h-5 w-5" /> File a
          Leave
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-black">
            Upcoming Leaves
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center text-slate-400 font-bold">
          <Plane className="h-12 w-12 mx-auto mb-4 opacity-10" />
          No employees are currently on leave or
          have upcoming leaves.
        </CardContent>
      </Card>
    </div>
  );
}
