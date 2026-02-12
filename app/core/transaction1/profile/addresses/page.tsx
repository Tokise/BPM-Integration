"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Plus,
  Navigation,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserAddressesPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Location & Address
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage your shipping and delivery
            locations
          </p>
        </div>
        <Button className="bg-slate-900 text-white font-black rounded-xl h-12 shadow-lg shadow-slate-200 px-6 flex items-center gap-2">
          <Plus className="h-5 w-5" /> Add Address
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
          <Navigation className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-900">
          No addresses saved
        </h3>
        <p className="text-slate-500 font-medium max-w-xs mt-2">
          Save your delivery locations for a
          faster checkout experience.
        </p>
      </Card>
    </div>
  );
}
