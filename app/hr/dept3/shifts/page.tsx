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
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() =>
                router.push("/hr/dept3")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Shift Scheduling
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Roster management & Team schedules
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-amber-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Assign New Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Assign Shift
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                    className="rounded-xl border-slate-100 focus:ring-amber-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="shift"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Shift Type
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
                    className="flex h-11 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option>Morning Shift</option>
                    <option>
                      Afternoon Shift
                    </option>
                    <option>Night Shift</option>
                    <option>Full Day</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="start"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Start Time
                    </Label>
                    <Input
                      id="start"
                      value={newShift.start_time}
                      onChange={(e) =>
                        setNewShift({
                          ...newShift,
                          start_time:
                            e.target.value,
                        })
                      }
                      placeholder="08:00"
                      className="rounded-xl border-slate-100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="end"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      End Time
                    </Label>
                    <Input
                      id="end"
                      value={newShift.end_time}
                      onChange={(e) =>
                        setNewShift({
                          ...newShift,
                          end_time:
                            e.target.value,
                        })
                      }
                      placeholder="17:00"
                      className="rounded-xl border-slate-100"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={handleAddShift}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-11"
              >
                Save Schedule
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <Input
            placeholder="Search employee or shift..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-amber-500 font-medium"
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
                  className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] overflow-hidden group hover:scale-[1.02] transition-all bg-white"
                >
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <LayoutGrid className="h-6 w-6" />
                      </div>
                      <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">
                        {shift.shift_name}
                      </p>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-all">
                        {shift.employee_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {shift.start_time} -{" "}
                        {shift.end_time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {shift.days}
                      </div>
                    </div>
                    <div className="flex -space-x-3 overflow-hidden">
                      <div
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200"
                        title="Team Member 1"
                      />
                      <div
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600"
                        title="Team Member 2"
                      >
                        +1
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}
