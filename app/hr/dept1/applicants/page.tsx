"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ApplicantsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Applicant Management
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Track and manage job applications
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95">
          <UserPlus className="h-5 w-5" /> Add
          Applicant
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <CardTitle className="text-xl font-black">
              Active Applicants
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10 h-11 w-[300px] rounded-xl bg-slate-50 border-none focus-visible:ring-amber-500"
                  placeholder="Search applicants..."
                />
              </div>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-slate-200 gap-2 font-bold"
              >
                <Filter className="h-4 w-4" />{" "}
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6">
              <UserPlus className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              No applicants found
            </h3>
            <p className="text-slate-500 font-medium max-w-xs mt-2">
              Start by adding a new applicant or
              adjusting your filters.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
