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
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
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
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (profile?.department as any)?.code;
  const isDept1 = pathname.startsWith("/hr/dept1");
  const isDept2 = pathname.startsWith("/hr/dept2");
  const isDept4 = pathname.startsWith("/hr/dept4");
  const baseUrl = isDept1
    ? "/hr/dept1"
    : isDept2
      ? "/hr/dept2"
      : isDept4
        ? "/hr/dept4"
        : "/hr/dept3";
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
    let query = supabase
      .schema("bpm-anec-global")
      .from("shift_schedule_management")
      .select("*");

    const roleStr = profile?.role?.toLowerCase() || "";
    const isHR4Admin = roleStr === "hr4_admin" || (roleStr === "hr_admin" && userDeptCode === "HR_DEPT4");
    const isPlatformAdmin = roleStr === "admin";
    const canManageShifts = isHR4Admin || isPlatformAdmin;

    if (!canManageShifts) {
      query = query.eq("employee_id", profile?.id);
    }

    const { data } = await query.order("created_at", {
      ascending: false,
    });

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
      .insert([
        {
          ...newShift,
          employee_id:
            profile?.role === "employee"
              ? profile?.id
              : undefined, // Or selected employee ID if admin
        },
      ]);

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
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href={baseUrl}>
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Shift Roster
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Shift Roster
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Workforce scheduling & Operational
            readiness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search by personnel..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-slate-900 font-medium text-xs shadow-none"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          {!isDept1 && !isDept2 && !isDept4 && (
            <Dialog
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3">
                  <Plus className="h-4 w-4" />{" "}
                  Assign New Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
                <div className="p-8 space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
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
                        value={
                          newShift.employee_name
                        }
                        onChange={(e) =>
                          setNewShift({
                            ...newShift,
                            employee_name:
                              e.target.value,
                          })
                        }
                        placeholder="e.g. David Brown"
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
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
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-xs focus:outline-none"
                      >
                        <option>
                          Morning Shift
                        </option>
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
                    className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-none uppercase tracking-widest text-[10px]"
                  >
                    Confirm Allocation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-lg animate-pulse border border-slate-100"
              />
            ))
            : filteredShifts.length > 0 ? (
                filteredShifts.map((shift) => (
                  <Card
                    key={shift.id}
                    className="border border-slate-200 shadow-none rounded-lg overflow-hidden group transition-all bg-white relative"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center font-black border border-slate-100 text-sm">
                          {shift.employee_name?.charAt(0)}
                        </div>
                        {!isDept1 && !isDept2 && !isDept4 && (
                          <button className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 mb-6">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          {shift.shift_name}
                        </p>
                        <div className="text-xl font-black text-slate-900 tracking-tighter transition-all group-hover:text-black leading-none">
                          <PrivacyMask
                            value={shift.employee_name}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 font-bold text-slate-400 text-[9px] uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-300" />
                          {shift.start_time} - {shift.end_time}
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3 w-3 text-slate-300" />
                          {shift.days}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                            {shift.shift_name?.charAt(0)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 p-0 h-auto"
                        >
                          View Log
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50">
                  <CalendarDays className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                    No current shifts
                  </p>
                  <p className="text-slate-400 text-xs mt-3 font-medium">
                    Your assigned shifts will appear here once
                    assigned by the HR admin.
                  </p>
                </div>
              )}
      </div>
    </div>
  );
}
