"use client";

import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingBag,
  DollarSign,
  Truck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  return (
    <div className="space-y-9 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 mt-10">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Dashboard
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Platform Overview & Metrics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue",
            value: "₱1,245,600",
            change: "+12.5%",
            icon: DollarSign,
            trend: "up",
          },
          {
            label: "Active Orders",
            value: "342",
            change: "+8.2%",
            icon: ShoppingBag,
            trend: "up",
          },
          {
            label: "Total Users",
            value: "2,840",
            change: "-2.4%",
            icon: Users,
            trend: "down",
          },
          {
            label: "Active Shipments",
            value: "86",
            change: "+18.1%",
            icon: Truck,
            trend: "up",
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-300 p-6 bg-white"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {stat.value}
                </h3>
              </div>
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-sm border border-slate-100">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              {stat.trend === "up" ? (
                <span className="text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-3 w-3 mr-1" />{" "}
                  {stat.change}
                </span>
              ) : (
                <span className="text-rose-500 flex items-center bg-rose-50 px-2 py-1 rounded-lg">
                  <ArrowDownRight className="h-3 w-3 mr-1" />{" "}
                  {stat.change}
                </span>
              )}
              <span className="text-slate-300">
                vs last month
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black">
              Recent Orders
            </CardTitle>
          </CardHeader>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Order ID
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Items
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Amount
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow
                    key={i}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <TableCell className="font-bold py-4">
                      #ORD-824{i}
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold">
                      2 items
                    </TableCell>
                    <TableCell className="font-black">
                      ₱
                      {(
                        2450 * i
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-blue-50 text-blue-500 text-[10px] font-black uppercase rounded-lg border border-blue-100">
                        To Ship
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Logistics Pulse */}
        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              Logistics Pulse
            </CardTitle>
          </CardHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <span>Warehouse Capacity</span>
                <span className="text-primary">
                  82%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[82%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <span>Fleet Utilization</span>
                <span className="text-blue-400">
                  65%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 w-[65%]" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Active Fleet
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "T-22",
                  "V-04",
                  "M-91",
                  "T-18",
                  "V-20",
                ].map((v) => (
                  <span
                    key={v}
                    className="px-2 py-1 bg-slate-900 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-800"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
