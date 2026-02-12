"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Car,
  Fuel,
  Wrench,
  Shield,
  Search,
  Map,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FleetManagementPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Fleet Management
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor vehicle status, maintenance
            logs, and fuel efficiency.
          </p>
        </div>
        <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />{" "}
          Register Vehicle
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
              85% Active
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              42 Vehicles
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Total Operational Fleet
            </p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
              04 Service
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              Maintenance
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Vehicle Downtime Monitor
            </p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Fuel className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">
              Optimal
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              $1,280.50
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Average Fuel Consumption
            </p>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Plate Number, Brand..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Vehicle
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Distance
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Driver
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-6 flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                        V-{i}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-none">
                          ABC-{i}092
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">
                          Toyota Hilux • 2024
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm font-medium text-slate-600">
                      {1200 + i * 45} KM
                    </td>
                    <td className="p-6 text-sm font-medium text-slate-600">
                      Juan D.
                    </td>
                    <td className="p-6">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase">
                        Available
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg font-black text-[10px] uppercase text-primary"
                      >
                        Track
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
