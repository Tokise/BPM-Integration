"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Landmark,
  Banknote,
  History,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PayoutManagementPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Payout Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Handle seller disbursements and
            banking
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200 px-6">
          Bulk Payout
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center">
        <Landmark className="h-16 w-16 text-slate-100 mb-6" />
        <h3 className="text-xl font-black text-slate-900">
          Financial Settlements
        </h3>
        <p className="text-slate-500 font-bold mt-2">
          Settlement cycles are currently up to
          date.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-lg">
          <div className="bg-slate-50 p-6 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Pending
            </p>
            <p className="text-xl font-black text-slate-900">
              ₱0.00
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Settled
            </p>
            <p className="text-xl font-black text-slate-900">
              ₱0.00
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
