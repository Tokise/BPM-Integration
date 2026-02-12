"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Subscriptions
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage platform membership plans
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0 flex flex-row items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-black">
              Plan Management
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-6">
            <p className="text-slate-500 font-medium">
              Create and modify subscription tiers
              for sellers.
            </p>
            <Button className="mt-6 bg-slate-900 text-white font-black rounded-xl w-full">
              Manage Plans
            </Button>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0 flex flex-row items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-xl font-black">
              Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-6">
            <p className="text-slate-500 font-medium">
              Monitor active memberships and
              renewals.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-xl w-full font-bold border-slate-200"
            >
              View Users
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
