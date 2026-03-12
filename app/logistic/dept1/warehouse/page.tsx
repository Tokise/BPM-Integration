"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Warehouse,
  Search,
  PackageCheck,
  AlertTriangle,
  Box,
  RefreshCcw,
  Store,
  ScanLine,
  ChevronRight,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { PrivacyMask } from "@/components/ui/privacy-mask";

interface SellerGroup {
  shopId: string;
  shopName: string;
  avatarUrl: string | null;
  fulfillmentType: string;
  totalSku: number;
  totalStock: number;
  lowStockCount: number;
  items: any[];
}

export default function WarehousePage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sellerGroups, setSellerGroups] =
    useState<SellerGroup[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory").select(`
        id,
        quantity,
        updated_at,
        shop_id,
        warehouses (name, location),
        products (id, name, slug, low_stock_threshold, stock_qty, barcode, price, categories(name), shop_id),
        shops:shop_id (id, name, avatar_url, fulfillment_type)
      `);

    if (!error && data) {
      setItems(data);
      const groups: Record<string, SellerGroup> =
        {};

      data.forEach((item: any) => {
        const shopId =
          item.shop_id ||
          item.products?.shop_id ||
          "internal";
        const shopName =
          (item.shops as any)?.name ||
          "Internal Inventory";
        const avatarUrl =
          (item.shops as any)?.avatar_url || null;
        const fType =
          (item.shops as any)?.fulfillment_type ||
          "seller";

        if (!groups[shopId]) {
          groups[shopId] = {
            shopId,
            shopName,
            avatarUrl,
            fulfillmentType: fType,
            totalSku: 0,
            totalStock: 0,
            lowStockCount: 0,
            items: [],
          };
        }
        groups[shopId].totalSku++;
        groups[shopId].totalStock +=
          item.quantity || 0;
        if (
          item.quantity <=
          (item.products?.low_stock_threshold ||
            10)
        ) {
          groups[shopId].lowStockCount++;
        }
        groups[shopId].items.push(item);
      });

      setSellerGroups(Object.values(groups));
    }
    setLoading(false);
  };

  const totalStock = items.reduce(
    (a, i) => a + (i.quantity || 0),
    0,
  );
  const lowItems = items.filter(
    (i) =>
      i.quantity <=
      (i.products?.low_stock_threshold || 10),
  );

  const filteredGroups = sellerGroups.filter(
    (g) =>
      g.shopName
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 max-w-7xl mx-auto pb-20 p-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept1"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Warehouse
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Cloud Warehouse
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            FBS Multi-Seller Integration •
            Inventory Control • Dept 1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(
                "/logistic/dept1/warehouse/receive",
              )
            }
            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg h-10 px-6 text-[10px] uppercase tracking-widest shadow-sm"
          >
            <ScanLine className="h-4 w-4 mr-2" />{" "}
            Receive Inbound
          </Button>
          <Button
            onClick={fetchInventory}
            variant="outline"
            className="h-10 w-10 p-0 rounded-lg border-slate-200"
          >
            <RefreshCcw
              className={cn(
                "h-4 w-4",
                loading && "animate-spin",
              )}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "FBS Sellers",
            val: sellerGroups.length,
            icon: Store,
            color: "blue",
          },
          {
            label: "Unique SKUs",
            val: items.length,
            icon: Box,
            color: "indigo",
          },
          {
            label: "Total Units",
            val: totalStock,
            icon: PackageCheck,
            color: "emerald",
          },
          {
            label: "Stock Alerts",
            val: lowItems.length,
            icon: AlertTriangle,
            color: "rose",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center border",
                    s.color === "blue" &&
                      "bg-blue-50 text-blue-600 border-blue-100",
                    s.color === "indigo" &&
                      "bg-indigo-50 text-indigo-600 border-indigo-100",
                    s.color === "rose" &&
                      "bg-rose-50 text-rose-600 border-rose-100",
                    s.color === "emerald" &&
                      "bg-emerald-50 text-emerald-600 border-emerald-100",
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {s.label}
                </p>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "..." : s.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-end items-center">
        <div className="relative group w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search seller shops..."
            className="pl-10 h-10 border-slate-200 shadow-none rounded-lg font-bold text-xs"
          />
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Managed Inventory Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100">
                  {[
                    "Seller Account",
                    "Range",
                    "On-Hand",
                    "Health",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "p-6 text-[10px] font-black uppercase tracking-widest text-slate-400",
                        h === "Actions" &&
                          "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 3 }).map(
                    (_, i) => (
                      <tr
                        key={i}
                        className="animate-pulse"
                      >
                        <td
                          colSpan={5}
                          className="p-12 bg-slate-50/10"
                        />
                      </tr>
                    ),
                  )
                ) : filteredGroups.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-20 text-center"
                    >
                      <Warehouse className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                        No FBS sellers found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr
                      key={g.shopId}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() =>
                        router.push(
                          `/logistic/dept1/warehouse/${g.shopId}`,
                        )
                      }
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
                            {g.avatarUrl ? (
                              <img
                                src={g.avatarUrl}
                                className="h-full w-full object-cover"
                                alt=""
                              />
                            ) : (
                              <Store className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 group-hover:text-slate-900 transition-colors uppercase text-sm tracking-tight">
                              <PrivacyMask
                                value={g.shopName}
                              />
                            </p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              {g.fulfillmentType ===
                              "warehouse"
                                ? "FBS Managed"
                                : "Seller Fulfilled"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-900 text-sm tracking-tight">
                          {g.totalSku}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Unique SKUs
                        </p>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-900 text-sm tracking-tight">
                          {g.totalStock}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Total Units
                        </p>
                      </td>
                      <td className="p-6">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border",
                            g.lowStockCount > 0
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100",
                          )}
                        >
                          {g.lowStockCount > 0
                            ? `${g.lowStockCount} Low Stock`
                            : "Healthy"}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <Button
                          variant="ghost"
                          className="h-10 w-10 p-0 rounded-lg text-slate-300 group-hover:text-slate-900 transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
