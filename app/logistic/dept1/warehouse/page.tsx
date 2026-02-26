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
  Filter,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function WarehousePage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        warehouses (name, location),
        products (name, slug)
      `);

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Warehouse Management
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor and manage inventory levels
            across all sorting centers.
          </p>
        </div>
        <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105">
          <Plus className="h-4 w-4 mr-2" /> Add
          Inventory Item
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search inventory..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium"
            />
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-xl bg-slate-50 border-none font-black text-slate-500"
          >
            <Filter className="h-4 w-4 mr-2" />{" "}
            Filters
          </Button>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Item Details
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Warehouse
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-slate-400 font-bold"
                    >
                      Loading inventory...
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="font-bold text-slate-900">
                          {item.products?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                          {item.products?.slug}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm font-medium text-slate-600">
                          {item.warehouses?.name}{" "}
                          -{" "}
                          {
                            item.warehouses
                              ?.location
                          }
                        </div>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${item.quantity > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                        >
                          {item.quantity > 0
                            ? "In Stock"
                            : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-slate-900">
                        {item.quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                    >
                      No inventory found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
