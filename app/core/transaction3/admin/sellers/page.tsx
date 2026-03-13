"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  ChevronRight,
  ArrowRight,
  Filter,
  MoreVertical,
  Mail,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface Shop {
  id: string;
  name: string;
  description: string;
  created_at: string;
  owner_id: string;
  fulfillment_type: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function SellersListPage() {
  const supabase = createClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");

  useEffect(() => {
    async function fetchShops() {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select(
          `
          *,
          profiles:owner_id (
            full_name,
            email
          )
        `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (!error && data) {
        setShops(data as any);
      }
      setLoading(false);
    }

    fetchShops();
  }, [supabase]);

  const filteredShops = shops.filter(
    (shop) =>
      shop.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      shop.profiles?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

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
              Sellers List
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">
              Sellers List
            </h1>
          </div>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage platform merchants &amp; storefronts
          </p>
        </div>

        <div className="relative group w-full md:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <Input
            placeholder="Search stores or owners..."
            className="pl-11 h-12 bg-white border-slate-200 shadow-none rounded-lg focus-visible:ring-amber-500 font-bold text-sm"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className="border border-slate-200 shadow-none rounded-lg p-6 bg-white animate-pulse"
            >
              <div className="h-40 bg-slate-50 rounded-lg mb-4" />
              <div className="h-4 w-1/2 bg-slate-50 rounded mb-2" />
              <div className="h-4 w-1/3 bg-slate-50 rounded" />
            </Card>
          ))
        ) : filteredShops.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
              No merchants found
            </p>
          </div>
        ) : (
          filteredShops.map((shop) => (
            <Card
              key={shop.id}
              className="border border-slate-200 shadow-none rounded-lg overflow-hidden group hover:scale-[1.01] transition-all duration-300 bg-white flex flex-col pt-6 px-6 pb-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="h-14 w-14 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
                  <Store className="h-7 w-7 text-amber-600 group-hover:text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest rounded-lg px-2 py-1">
                    Active
                  </Badge>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(
                      shop.created_at,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    {shop.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-2 line-clamp-2">
                    {shop.description ||
                      "No store description provided."}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <ShieldCheck className="h-3 w-3 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">
                        Owner
                      </p>
                      <p className="text-[11px] font-black text-slate-700">
                        {shop.profiles
                          ?.full_name ||
                          "Unknown Owner"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Building2 className="h-3 w-3 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">
                        Fulfillment
                      </p>
                      <p className="text-[11px] font-black text-slate-700 capitalize">
                        {shop.fulfillment_type ||
                          "Direct"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden"
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${shop.id}${i}`}
                        alt="user"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase">
                      +12
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
