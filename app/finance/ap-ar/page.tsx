"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileStack,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function APARPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Accounts Payable / Receivable
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Monitor obligations and credits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white flex flex-col items-center">
          <ArrowDownLeft className="h-12 w-12 text-red-500 opacity-20 mb-4" />
          <h3 className="font-black text-lg">
            Accounts Payable
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-2">
            ₱0.00
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white flex flex-col items-center">
          <ArrowUpRight className="h-12 w-12 text-emerald-500 opacity-20 mb-4" />
          <h3 className="font-black text-lg">
            Accounts Receivable
          </h3>
          <p className="text-3xl font-black text-slate-900 mt-2">
            ₱0.00
          </p>
        </Card>
      </div>
    </div>
  );
}
