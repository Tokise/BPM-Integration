"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  FileCheck,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TimesheetsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Timesheet Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Approve and consolidate work logs
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl h-12 px-6 font-bold border-slate-200"
        >
          <Download className="h-5 w-5 mr-2" />{" "}
          Export Timesheets
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
            <ClipboardList className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            No pending timesheets
          </h3>
          <p className="text-slate-500 font-medium max-w-xs mt-2">
            All employee work logs have been
            processed and approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
