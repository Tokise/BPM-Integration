"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Award,
  UserPlus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessionPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Succession Planning
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Identify and develop future leaders
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
          <UserPlus className="h-5 w-5" /> Talent
          Pipeline
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-12 text-center flex flex-col items-center">
          <div className="h-24 w-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            No succession plans
          </h3>
          <p className="text-slate-500 font-medium max-w-sm mt-2">
            Start identifying high-potential
            employees for critical roles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
