"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Coins,
  Landmark,
  History,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollectionPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Collection
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage incoming payments and
            receivables
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center">
        <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
          <Coins className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-slate-900">
          Payment Collection
        </h3>
        <p className="text-slate-500 font-bold mt-2">
          Track real-time inflows from all
          platform transactions.
        </p>
      </Card>
    </div>
  );
}
