"use client";

import { useUser } from "@/context/UserContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Truck,
  Warehouse,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function LogisticDashboard() {
  const { profile } = useUser();

  const stats = [
    {
      title: "Total Shipments",
      value: "1,284",
      icon: Package,
      change: "+12.5%",
      tr: "up",
    },
    {
      title: "Active Deliveries",
      value: "42",
      icon: Truck,
      change: "+3.2%",
      tr: "up",
    },
    {
      title: "In Warehouse",
      value: "856",
      icon: Warehouse,
      change: "-2.1%",
      tr: "down",
    },
    {
      title: "Active Personnel",
      value: "18",
      icon: Users,
      change: "0%",
      tr: "neutral",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Logistics Overview
        </h1>
        <p className="text-slate-500 font-medium">
          Manage shipments, warehouse inventory,
          and delivery personnel.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {stat.tr === "up" && (
                  <ArrowUpRight className="h-3 w-4 text-green-500" />
                )}
                {stat.tr === "down" && (
                  <ArrowDownRight className="h-3 w-4 text-red-500" />
                )}
                <span
                  className={`text-[10px] font-black ${stat.tr === "up" ? "text-green-500" : stat.tr === "down" ? "text-red-500" : "text-slate-400"}`}
                >
                  {stat.change} vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Package className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      Shipment #ORD-{i}092 landed
                      at Warehouse
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      2 hours ago
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase">
                    Received
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid gap-4">
            <button className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors text-left group">
              <div className="h-10 w-10 rounded-xl bg-amber-200/50 flex items-center justify-center text-amber-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Register New Shipment
                </p>
                <p className="text-[10px] text-amber-700 font-bold">
                  Inbound or Outbound
                </p>
              </div>
            </button>
            <button className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors text-left group">
              <div className="h-10 w-10 rounded-xl bg-blue-200/50 flex items-center justify-center text-blue-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Manage Personnel
                </p>
                <p className="text-[10px] text-blue-700 font-bold">
                  View active drivers
                </p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
