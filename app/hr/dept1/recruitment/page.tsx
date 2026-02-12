"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  UserPlus,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecruitmentPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Recruitment
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Talent Acquisition & Pipelines
          </p>
        </div>
        <Button className="rounded-xl font-bold gap-2">
          <UserPlus className="h-4 w-4" />
          Post New Job
        </Button>
      </div>

      <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
          <CardTitle className="text-xl font-black">
            Active Applicants
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applicants..."
                className="pl-9 rounded-xl bg-slate-50 border-none h-10 font-bold text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-slate-200"
            >
              <Filter className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 border-none hover:bg-slate-50/50">
                <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Candidate
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Position
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Status
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Applied Date
                </TableHead>
                <TableHead className="pr-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Alice Johnson",
                  role: "UI Designer",
                  status: "Interviewing",
                  date: "Feb 02, 2024",
                },
                {
                  name: "Robert Smith",
                  role: "Fullstack Dev",
                  status: "Screening",
                  date: "Feb 01, 2024",
                },
                {
                  name: "Sarah Lee",
                  role: "Product Manager",
                  status: "Offered",
                  date: "Jan 28, 2024",
                },
                {
                  name: "Michael Chen",
                  role: "DevOps Engineer",
                  status: "Rejected",
                  date: "Jan 25, 2024",
                },
              ].map((candidate, idx) => (
                <TableRow
                  key={idx}
                  className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {candidate.name[0]}
                      </div>
                      <span className="font-bold text-slate-900">
                        {candidate.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-600">
                    {candidate.role}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase rounded-lg border",
                        candidate.status ===
                          "Interviewing" &&
                          "bg-blue-50 text-blue-500 border-blue-100",
                        candidate.status ===
                          "Screening" &&
                          "bg-amber-50 text-amber-500 border-amber-100",
                        candidate.status ===
                          "Offered" &&
                          "bg-emerald-50 text-emerald-500 border-emerald-100",
                        candidate.status ===
                          "Rejected" &&
                          "bg-rose-50 text-rose-500 border-rose-100",
                      )}
                    >
                      {candidate.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 font-bold text-xs">
                    {candidate.date}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-black text-[10px] uppercase hover:text-primary"
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
