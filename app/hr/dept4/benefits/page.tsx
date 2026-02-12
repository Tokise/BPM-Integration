"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HeartPulse,
  Shield,
  Crosshair,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BenefitsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            HMO & Benefits
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Employee health and wellness coverage
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200 px-6">
          Manage Providers
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden flex flex-col items-center justify-center py-24 text-center">
        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <HeartPulse className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-slate-900">
          No active benefits plans
        </h3>
        <p className="text-slate-500 font-medium max-w-sm mt-2">
          Initialize your healthcare and benefits
          provider list to start enrollment.
        </p>
      </Card>
    </div>
  );
}
