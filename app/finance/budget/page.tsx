"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PiggyBank,
  Calculator,
  TrendingDown,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BudgetManagementPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Budget Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Financial planning and allocation
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-12 shadow-lg shadow-blue-200 px-6">
          <Plus className="h-5 w-5 mr-2" /> Create
          Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white overflow-hidden">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black">
              Plan Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-6 text-center">
            <PiggyBank className="h-16 w-16 mx-auto text-blue-500 opacity-20 mb-4" />
            <p className="font-bold text-slate-400">
              Initialize your financial year to
              start budgeting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
