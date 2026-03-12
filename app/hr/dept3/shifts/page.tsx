"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Search,
  Plus,
  Clock,
  Calendar,
  User,
  MoreVertical,
  ChevronLeft,
  Users,
  Briefcase,
  MapPin,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function ShiftManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newShift, setNewShift] = useState({
    employee_name: "",
    shift_name: "Morning Shift",
    start_time: "08:00",
    end_time: "17:00",
    days: "Mon-Fri",
  });

  useEffect(() => {
    fetchShifts();

    const channel = supabase
      .channel("shift_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "shift_schedule_management",
        },
        fetchShifts,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("shift_schedule_management")
      .select("*")
      .order("created_at", { ascending: false });

    setShifts(data || []);
    setLoading(false);
  };

  const handleAddShift = async () => {
    if (
      !newShift.employee_name ||
      !newShift.shift_name
    )
      return toast.error(
        "All fields are required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shift_schedule_management")
      .insert([newShift]);

    if (error) {
      toast.error("Failed to add shift");
    } else {
      toast.success(
        "Shift assigned successfully",
      );
      setIsModalOpen(false);
      setNewShift({
        employee_name: "",
        shift_name: "Morning Shift",
        start_time: "08:00",
        end_time: "17:00",
        days: "Mon-Fri",
      });
      fetchShifts();
    }
  };

  const filteredShifts = shifts.filter(
    (s) =>
      s.employee_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      s.shift_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr/dept3">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Shift Roster
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Shift Roster
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Workforce scheduling & Operational
            readiness
          </p>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-slate-200 uppercase tracking-widest text-[10px] flex items-center gap-3">
              <Plus className="h-4 w-4" /> Assign
              New Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tighter">
                  New Assignment
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="employee"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Employee Name
                  </Label>
                  <Input
                    id="employee"
                    value={newShift.employee_name}
                    onChange={(e) =>
                      setNewShift({
                        ...newShift,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. David Brown"
                    className="h-14 rounded-2xl border-none bg-slate-50 font-bold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="shift"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Shift Configuration
                  </Label>
                  <select
                    id="shift"
                    value={newShift.shift_name}
                    onChange={(e) =>
                      setNewShift({
                        ...newShift,
                        shift_name:
                          e.target.value,
                      })
                    }
                    className="flex h-14 w-full rounded-2xl border-none bg-slate-50 px-3 py-2 font-bold text-sm focus:outline-none"
                  >
                    <option>Morning Shift</option>
                    <option>
                      Afternoon Shift
                    </option>
                    <option>Night Shift</option>
                    <option>Full Day</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleAddShift}
                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-100 uppercase tracking-widest text-[10px]"
              >
                Confirm Allocation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <Input
          placeholder="Search by personnel or shift..."
          className="pl-11 h-14 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl focus-visible:ring-indigo-500 font-medium"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-[40px] animate-pulse"
              />
            ))
          : filteredShifts.map((shift) => (
              <Card
                key={shift.id}
                className="border-none shadow-2xl shadow-slate-100 rounded-[40px] overflow-hidden group hover:scale-[1.02] transition-all bg-white relative"
              >
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center font-black italic">
                      {shift.employee_name?.charAt(
                        0,
                      )}
                    </div>
                    <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {shift.shift_name}
                    </p>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter transition-all group-hover:text-indigo-600">
                      <PrivacyMask
                        value={
                          shift.employee_name
                        }
                      />
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 font-bold text-slate-400 text-[9px] uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-slate-300" />
                      {shift.start_time} -{" "}
                      {shift.end_time}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-slate-300" />
                      {shift.days}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white ring-2 ring-slate-50 flex items-center justify-center text-[10px] font-black italic text-slate-400">
                        {shift.shift_name?.charAt(
                          0,
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 p-0 h-auto"
                    >
                      View Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
