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
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkforcePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Workforce
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Employee Directory & Management
          </p>
        </div>
        <Button className="rounded-xl font-bold gap-2">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-100 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
          <CardTitle className="text-xl font-black">
            Employee Directory
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search employees..."
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
                  Employee
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  ID
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Department
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Role
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Status
                </TableHead>
                <TableHead className="pr-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "John Doe",
                  id: "EMP-001",
                  dept: "Engineering",
                  role: "Senior Developer",
                  status: "Active",
                },
                {
                  name: "Jane Smith",
                  id: "EMP-002",
                  dept: "Design",
                  role: "Lead Designer",
                  status: "Active",
                },
                {
                  name: "Dave Wilson",
                  id: "EMP-003",
                  dept: "Logistics",
                  role: "Fleet Manager",
                  status: "On Leave",
                },
                {
                  name: "Maria Garcia",
                  id: "EMP-004",
                  dept: "HR",
                  role: "Specialist",
                  status: "Active",
                },
              ].map((emp, idx) => (
                <TableRow
                  key={idx}
                  className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs uppercase">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="font-bold text-slate-900">
                        {emp.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-400 text-xs">
                    {emp.id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-600">
                    {emp.dept}
                  </TableCell>
                  <TableCell className="text-slate-500 font-bold">
                    {emp.role}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[9px] font-black uppercase rounded-md border",
                        emp.status === "Active"
                          ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                          : "bg-amber-50 text-amber-500 border-amber-100",
                      )}
                    >
                      {emp.status}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-8 w-8 text-slate-400"
                    >
                      <MoreHorizontal className="h-4 w-4" />
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
