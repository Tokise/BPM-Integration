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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function ProductCatalogPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href="/core/transaction3/admin">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Product Catalog
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Product Catalog
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] mt-1">
            Core 3: Global product master database
          </p>
        </div>
        <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-12 shadow-none px-6 flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all">
          <Plus className="h-5 w-5" /> Import
          Catalog
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <a href="/core/transaction3/admin/catalog/categories">
          <Card className="border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden p-12 text-center flex flex-col items-center hover:bg-slate-50 transition-all cursor-pointer group">
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
      </div>
    </div>
  );
}
