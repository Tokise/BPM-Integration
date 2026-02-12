"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Store,
  ShoppingCart,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StorefrontViewer() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Storefront Viewer
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-11 w-[300px] rounded-xl bg-white border-none shadow-sm focus-visible:ring-primary"
            placeholder="Search shops..."
          />
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center">
        <Store className="h-16 w-16 text-slate-100 mb-6" />
        <h3 className="text-xl font-black text-slate-900">
          Browsing Marketplace
        </h3>
        <p className="text-slate-500 font-bold mt-2">
          Connecting to shop inventory records...
        </p>
        <Button className="mt-8 bg-slate-900 text-white font-black rounded-xl h-11 px-8">
          Refresh Shops
        </Button>
      </Card>
    </div>
  );
}
