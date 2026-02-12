"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Book,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GeneralLedgerPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            General Ledger
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Main accounting record of the business
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl h-12 px-6 font-bold border-slate-200"
        >
          <FileText className="h-5 w-5 mr-2" />{" "}
          Preview Ledger
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center">
        <Book className="h-16 w-16 text-slate-100 mb-6" />
        <h3 className="text-xl font-black text-slate-900">
          Financial Records
        </h3>
        <p className="text-slate-500 font-bold mt-2">
          Your company's financial statements will
          be compiled here.
        </p>
      </Card>
    </div>
  );
}
