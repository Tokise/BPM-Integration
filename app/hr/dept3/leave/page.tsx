"use client";

import { useEffect, useState } from "react";
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

export default function LeaveManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newRequest, setNewRequest] = useState({
    employee_name: "",
    leave_type: "Sick",
    start_date: "",
    end_date: "",
    status: "pending",
    reason: "",
  });

  useEffect(() => {
    fetchRequests();

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
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("leave_management")
      .select("*")
      .order("created_at", { ascending: false });

    setRequests(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
  ) => {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("leave_management")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Request ${status}`);
      fetchRequests();
    }
  };

  const handleAddRequest = async () => {
    if (
      !newRequest.employee_name ||
      !newRequest.start_date ||
      !newRequest.end_date
    )
      return toast.error(
        "All fields are required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("leave_management")
      .insert([newRequest]);

    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Leave request submitted");
      setIsModalOpen(false);
      setNewRequest({
        employee_name: "",
        leave_type: "Sick",
        start_date: "",
        end_date: "",
        status: "pending",
        reason: "",
      });
      fetchRequests();
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.employee_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      r.leave_type
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
              <Link href="/hr/dept3">
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
                      Employee Name
                    </Label>
                    <Input
                      id="employee"
                      value={
                        newRequest.employee_name
                      }
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          employee_name:
                            e.target.value,
                        })
                      }
                      placeholder="e.g. Mike Smith"
                      className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                    />
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
                      value={
                        newRequest.leave_type
                      }
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          leave_type:
                            e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                          {req.employee_name.charAt(
                            0,
                          )}
                        </div>
                        <span className="font-bold text-slate-900">
                          <PrivacyMask
                            value={
                              req.employee_name
                            }
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {req.leave_type}
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
                          "pending" && (
                          <>
                            <Button
                              onClick={() =>
                                handleUpdateStatus(
                                  req.id,
                                  "approved",
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
            <div className="p-32 text-center">
              <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="h-6 w-6 text-slate-200" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-2 uppercase">
                No Leave Requests
              </h3>
            </div>
          )}
      </div>
    </div>
  );
}
