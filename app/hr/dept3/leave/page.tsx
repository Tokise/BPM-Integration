"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  Select as SelectUI,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import { toast } from "sonner";
import { notifyDepartment } from "@/app/actions/notifications";
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

export default function LeaveManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (
    profile?.department as any
  )?.code;
  const roleStr = profile?.role?.toLowerCase() || "";
  const isHR3Admin =
    roleStr === "hr3_admin" ||
    (roleStr === "hr" && userDeptCode === "HR_DEPT3") ||
    roleStr === "admin";
  const isHR3Employee = roleStr === "hr3_employee" || roleStr === "employee";
  const isDept1 =
    pathname.startsWith("/hr/dept1");
  const isDept2 =
    pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1
    ? "/hr/dept1"
    : isDept2
      ? "/hr/dept2"
      : "/hr/dept3";
  const [requests, setRequests] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newRequest, setNewRequest] = useState({
    type: "Sick",
    start_date: "",
    end_date: "",
    status: "pending",
    reason: "",
  });

  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [selectedEmpId, setSelectedEmpId] =
    useState("");
  const [
    employeeSearchQuery,
    setEmployeeSearchQuery,
  ] = useState("");

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("*")
      .not("role", "in", '("customer","seller")');
    setEmployees(data || []);
  }, [supabase]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .schema("bpm-anec-global")
      .from("leave_management").select(`
        *,
        profiles!leave_management_employee_id_fkey(full_name, email)
      `);

    if (!isHR3Admin) {
      query = query.eq(
        "employee_id",
        profile?.id,
      );
    }

    const { data } = await query.order(
      "created_at",
      {
        ascending: false,
      },
    );

    setRequests(data || []);
    setLoading(false);
  }, [isHR3Admin, profile?.id, supabase]);

  useEffect(() => {
    fetchRequests();
    fetchEmployees();

    const channel = supabase
      .channel("leave_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "leave_management",
        },
        fetchRequests,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, fetchEmployees, supabase]);


  const handleUpdateStatus = async (
    id: string,
    status: string,
    employeeEmail?: string,
    employeeName?: string,
    leaveType?: string,
    startDate?: string,
    endDate?: string,
  ) => {
    if (!isHR3Admin) {
      return toast.error("Unauthorized");
    }

    const { updateLeaveStatusAction } =
      await import("@/app/actions/hr_leave");
    const result = await updateLeaveStatusAction(
      id,
      status,
      employeeEmail,
      employeeName,
      leaveType,
      `${startDate} to ${endDate}`,
    );

    if (result.success) {
      toast.success(`Request ${status}`);
      fetchRequests();
    } else {
      toast.error(
        result.error || "Failed to update status",
      );
    }
  };

  const handleAddRequest = async () => {
    if (
      !selectedEmpId &&
      isHR3Admin
    )
      return toast.error(
        "Employee selection is required",
      );

    if (
      !newRequest.start_date ||
      !newRequest.end_date
    )
      return toast.error("Dates are required");

    const submission = {
      ...newRequest,
      employee_id: !isHR3Admin
          ? profile?.id!
          : selectedEmpId,
    };

    const { submitLeaveRequestAction } =
      await import("@/app/actions/hr_leave");
    const result =
      await submitLeaveRequestAction(submission);

    if (result.success) {
      toast.success("Leave request submitted");
      setIsModalOpen(false);
      setNewRequest({
        type: "Sick",
        start_date: "",
        end_date: "",
        status: "pending",
        reason: "",
      });
      setSelectedEmpId("");
      
      const empName = !isHR3Admin ? profile?.full_name : employees.find(e => e.id === submission.employee_id)?.full_name;

      // Notify HR3 Department
      await notifyDepartment({
        deptCode: "HR_DEPT3",
        title: "New Leave Request Submitted",
        message: `${empName} has filed a ${submission.type} leave request from ${submission.start_date} to ${submission.end_date}.`,
        type: "system"
      });

      fetchRequests();
    } else {
      toast.error(
        result.error ||
          "Failed to submit request",
      );
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      (r.profiles?.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (r.type || "")
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
              Leave Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Leave Management
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Absence tracking & approval workflow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search employee names..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-slate-900 font-medium text-xs shadow-none"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px]">
                <Plus className="h-4 w-4 mr-2" />{" "}
                File New Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    New Leave Request
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="employee"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Employee Selection
                    </Label>
                    {!isHR3Admin ? (
                      <Input
                        id="employee"
                        value={
                          profile?.full_name || ""
                        }
                        disabled
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                      />
                    ) : (
                      <>
                        <div className="relative group mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                          <Input
                            placeholder="Search personnel..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-slate-900 text-xs shadow-none"
                            value={
                              employeeSearchQuery
                            }
                            onChange={(e) =>
                              setEmployeeSearchQuery(
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <SelectUI
                          value={selectedEmpId}
                          onValueChange={
                            setSelectedEmpId
                          }
                        >
                          <SelectTrigger className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs">
                            <SelectValue placeholder="Select Personnel..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {employees
                              .filter((emp) =>
                                emp.full_name
                                  ?.toLowerCase()
                                  .includes(
                                    employeeSearchQuery.toLowerCase(),
                                  ),
                              )
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
                        </SelectUI>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="start"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Start Date
                      </Label>
                      <Input
                        id="start"
                        type="date"
                        min={
                          new Date()
                            .toISOString()
                            .split("T")[0]
                        }
                        value={
                          newRequest.start_date
                        }
                        onChange={(e) =>
                          setNewRequest({
                            ...newRequest,
                            start_date:
                              e.target.value,
                          })
                        }
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="end"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        End Date
                      </Label>
                      <Input
                        id="end"
                        type="date"
                        min={
                          newRequest.start_date ||
                          new Date()
                            .toISOString()
                            .split("T")[0]
                        }
                        value={
                          newRequest.end_date
                        }
                        onChange={(e) =>
                          setNewRequest({
                            ...newRequest,
                            end_date:
                              e.target.value,
                          })
                        }
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="type"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Leave Type
                    </Label>
                    <select
                      id="type"
                      value={newRequest.type}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          type: e.target.value,
                        })
                      }
                      className="w-full h-12 rounded-[16px] border border-slate-100 bg-slate-50 px-4 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 transition-all appearance-none outline-none"
                    >
                      <option>Sick</option>
                      <option>Vacation</option>
                      <option>Emergency</option>
                      <option>Bereavement</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAddRequest}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 shadow-none uppercase tracking-widest text-[10px]"
                >
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Employee
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Leave Type
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Period
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="px-8 py-6 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [1, 2, 3].map((i) => (
                  <tr
                    key={i}
                    className="animate-pulse border-b border-slate-50"
                  >
                    <td
                      colSpan={5}
                      className="h-20 px-8 py-6 bg-white/50"
                    />
                  </tr>
                ))
              : filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center font-black border border-slate-100">
                          {(req.profiles?.full_name || "U").charAt(
                            0,
                          )}
                        </div>
                        <span className="font-bold text-slate-900">
                          <PrivacyMask
                            value={
                              req.profiles?.full_name || "Unknown"
                            }
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {req.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {req.reason || "No reason provided"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-600 text-xs">
                      {req.start_date} →{" "}
                      {req.end_date}
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-none ${
                          req.status ===
                          "approved"
                            ? "bg-emerald-50 text-emerald-600"
                            : req.status ===
                                "rejected"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600 animate-pulse"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {req.status ===
                          "pending" &&
                          isHR3Admin && (
                            <>
                              <Button
                                onClick={() =>
                                  handleUpdateStatus(
                                    req.id,
                                    "approved",
                                    req.profiles
                                      ?.email,
                                    req.profiles
                                      ?.full_name || "Unknown",
                                    req.type,
                                    req.start_date,
                                    req.end_date,
                                  )
                                }
                                className="h-8 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-none"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  handleUpdateStatus(
                                    req.id,
                                    "rejected",
                                    req.profiles
                                      ?.email,
                                    req.profiles
                                      ?.full_name || "Unknown",
                                    req.type,
                                    req.start_date,
                                    req.end_date,
                                  )
                                }
                                className="h-8 rounded-lg text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 &&
          !loading && (
            <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50 mt-8">
              <CalendarDays className="h-16 w-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                No current leave requests
              </p>
              <p className="text-slate-400 text-xs mt-3 font-medium">
                Your leave balanced and requests
                will appear here once submitted.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
