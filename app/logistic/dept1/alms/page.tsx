"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wrench,
  ShieldAlert,
  History,
  Activity,
  PenTool,
  Database,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ALMSPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Asset Lifecycle (ALMS)
          </h1>
          <p className="text-slate-500 font-medium">
            Track and maintain physical assets,
            equipment, and logistics
            infrastructure.
          </p>
        </div>
        <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Tag
          New Asset
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Assets",
            val: "156",
            icon: Database,
            color: "blue",
          },
          {
            label: "Active Maintenance",
            val: "12",
            icon: Wrench,
            color: "amber",
          },
          {
            label: "Critical Alerts",
            val: "02",
            icon: ShieldAlert,
            color: "red",
          },
          {
            label: "System Uptime",
            val: "99.9%",
            icon: Activity,
            color: "green",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm rounded-2xl bg-white overflow-hidden"
          >
            <CardContent className="p-6">
              <div
                className={`h-10 w-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black">
              Maintenance Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500">
                    Feb {20 + i}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">
                      Vehicle Fleet Checkup - Van
                      #{i}04
                    </p>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">
                      Standard preventive
                      maintenance and safety
                      audit.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg font-black text-primary uppercase text-[10px]"
                  >
                    Reschedule
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black">
              History Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-slate-200 mt-1.5" />
                    <div className="flex-1 w-px bg-slate-100 my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-black text-slate-900 leading-none">
                      Asset Relocated
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Forklift-A2 moved to Zone C
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
