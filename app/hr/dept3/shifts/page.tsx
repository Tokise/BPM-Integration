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
  Trash2,
  CalendarRange,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const formatTimeTo12h = (timeStr: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export default function ShiftManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (profile?.department as any)?.code;
  const isDept1 = pathname.startsWith("/hr/dept1");
  const isDept2 = pathname.startsWith("/hr/dept2");
  const isLogistics = profile?.role?.toLowerCase().startsWith("logistic");
  const isFinance = profile?.role?.toLowerCase().startsWith("finance");
  const baseUrl =
    pathname.startsWith("/finance") ? "/finance" :
    pathname.startsWith("/logistic/dept1") ? "/logistic/dept1" :
    pathname.startsWith("/logistic/dept2/driver") ? "/logistic/dept2/driver" :
    pathname.startsWith("/logistic/dept2") ? "/logistic/dept2" :
    isDept1 ? "/hr/dept1" :
    isDept2 ? "/hr/dept2" :
    "/hr/dept3";

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    employee_name: "",
    shift_name: "Morning Shift",
    start_time: "08:00",
    end_time: "17:00",
    days: "Mon-Fri",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  useEffect(() => {
    fetchShifts();
    fetchEmployees();

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
    const isHR3Admin = roleStr === "hr3_admin" || (roleStr === "hr_admin" && userDeptCode === "HR_DEPT3");
    const isPlatformAdmin = roleStr === "admin";
    const canManageShifts = isHR3Admin || isPlatformAdmin;

    if (!canManageShifts) {
      query = query.eq("employee_id", profile?.id);
    }

    const { data } = await query.order("shift_name", { ascending: true });
    setShifts(data || []);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("*")
      .not("role", "in", '("customer","seller")');
    setEmployees(data || []);
  };

  const handleAddShift = async () => {
    const isSelfAssignment = profile?.role === "employee" || profile?.role === "hr3_employee";
    const empId = isSelfAssignment ? profile?.id : selectedEmpId;
    const selectedEmp = employees.find(e => e.id === empId);
    
    if (!empId || !newShift.shift_name) {
      return toast.error("All fields are required");
    }

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("shift_schedule_management")
      .insert([
        {
          ...newShift,
          employee_id: empId,
          employee_name: selectedEmp?.full_name || "Unknown",
        },
      ]);

    if (error) {
      toast.error("Failed to add shift");
    } else {
      toast.success("Shift assigned successfully");
      setIsModalOpen(false);
      setNewShift({
        employee_name: "",
        shift_name: "Morning Shift",
        start_time: "08:00",
        end_time: "17:00",
        days: "Mon-Fri",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });
      fetchShifts();
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    toast("Remove Shift Assignment?", {
      description: "Are you sure you want to remove this shift assignment?",
      action: {
        label: "Remove",
        onClick: async () => {
          const { error } = await supabase
            .schema("bpm-anec-global")
            .from("shift_schedule_management")
            .delete()
            .eq("id", shiftId);

          if (error) {
            toast.error("Failed to remove shift");
          } else {
            toast.success("Shift assignment removed");
            fetchShifts();
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const filteredShifts = shifts.filter(
    (s) =>
      s.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shift_name?.toLowerCase().includes(searchQuery.toLowerCase()),
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

          {((profile?.role?.toLowerCase() === "hr3_admin") || (profile?.role?.toLowerCase() === "admin") || (profile?.role?.toLowerCase() === "hr" && userDeptCode === "HR_DEPT3")) && (
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
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Employee Selection
                      </Label>
                      <div className="relative group mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input
                          placeholder="Search personnel..."
                          className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-slate-900 text-xs shadow-none"
                          value={employeeSearchQuery}
                          onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select
                        value={selectedEmpId}
                        onValueChange={setSelectedEmpId}
                      >
                        <SelectTrigger className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs">
                          <SelectValue placeholder="Select Personnel..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {employees
                            .filter(emp => {
                              const matchesSearch = emp.full_name?.toLowerCase().includes(employeeSearchQuery.toLowerCase());
                              const hasShift = shifts.some(s => s.employee_id === emp.id);
                              return matchesSearch && !hasShift;
                            })
                            .map((emp) => (
                              <SelectItem
                                key={emp.id}
                                value={emp.id}
                                className="font-bold text-xs"
                              >
                                {emp.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Start Date
                        </Label>
                        <Input
                          type="date"
                          className="h-10 bg-slate-50 border-slate-200 rounded-lg text-xs font-bold"
                          value={newShift.start_date}
                          onChange={(e) => setNewShift({...newShift, start_date: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          End Date
                        </Label>
                        <Input
                          type="date"
                          className="h-10 bg-slate-50 border-slate-200 rounded-lg text-xs font-bold"
                          value={newShift.end_date}
                          onChange={(e) => setNewShift({...newShift, end_date: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Start Time
                        </Label>
                        <Input
                          type="time"
                          className="h-10 bg-slate-50 border-slate-200 rounded-lg text-xs font-bold"
                          value={newShift.start_time}
                          onChange={(e) => setNewShift({...newShift, start_time: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          End Time
                        </Label>
                        <Input
                          type="time"
                          className="h-10 bg-slate-50 border-slate-200 rounded-lg text-xs font-bold"
                          value={newShift.end_time}
                          onChange={(e) => setNewShift({...newShift, end_time: e.target.value})}
                        />
                      </div>
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
                        <option>Morning Shift</option>
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

      <div className="space-y-12">
        {["Morning Shift", "Night Shift", "Full Day"].map((shiftCat) => {
          const categoryShifts = filteredShifts.filter(s => s.shift_name === shiftCat);
          if (categoryShifts.length === 0) return null;

          return (
            <div key={shiftCat} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {shiftCat}
                </h2>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryShifts.map((shift) => (
                  <Card
                    key={shift.id}
                    className="border border-slate-200 shadow-none rounded-lg overflow-hidden group transition-all bg-white relative"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center font-black border-2 border-slate-100 text-xl shadow-sm">
                          {shift.employee_name?.charAt(0)}
                        </div>
                        {((profile?.role?.toLowerCase() === "hr3_admin") || (profile?.role?.toLowerCase() === "admin") || (profile?.role?.toLowerCase() === "hr" && userDeptCode === "HR_DEPT3")) && (
                          <div className="flex gap-1">
                            <button className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteShift(shift.id)}
                              className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 mb-6">
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                          {shift.shift_name}
                        </p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter transition-all group-hover:text-black">
                          <PrivacyMask
                            value={shift.employee_name}
                          />
                        </h3>
                      </div>
                      <div className="flex flex-col gap-3 py-6 border-y border-slate-50 mb-6 font-bold text-slate-900 text-sm tracking-tight">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-black">
                            {formatTimeTo12h(shift.start_time)} -{" "}
                            {formatTimeTo12h(shift.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <CalendarRange className="h-4 w-4 text-amber-600" />
                          </div>
                          {shift.start_date && shift.end_date ? (
                            <span className="font-black">{new Date(shift.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(shift.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          ) : (
                            <span className="font-black">{shift.days}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        {((profile?.role?.toLowerCase() === "hr3_admin") || (profile?.role?.toLowerCase() === "admin") || (profile?.role?.toLowerCase() === "hr" && userDeptCode === "HR_DEPT3")) && (
                          <Button
                            variant="ghost"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 p-0 h-auto"
                          >
                            View Log
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {filteredShifts.length === 0 && !loading && (
          <div className="p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50">
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

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-lg animate-pulse border border-slate-100"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
