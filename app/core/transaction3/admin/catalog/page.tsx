"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Search,
  Filter,
  Database,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductCatalogPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Product Catalog
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Global product master database
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 shadow-lg shadow-amber-200 px-6 flex items-center gap-2">
          <Plus className="h-5 w-5" /> Import
          Catalog
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <a href="/core/transaction3/admin/catalog/categories">
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
              <Database className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Manage Categories
            </h3>
            <p className="text-slate-500 font-bold mt-2 text-sm">
              Organize products into global
              categories and subcategories.
            </p>
          </Card>
        </a>

        <a href="/core/transaction3/admin/catalog/products">
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <Package className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Manage Products
            </h3>
            <p className="text-slate-500 font-bold mt-2 text-sm">
              View and manage the global product
              master list.
            </p>
          </Card>
        </a>
      </div>
    </div>
  );
}
