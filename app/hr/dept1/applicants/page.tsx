"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AddApplicantModal } from "@/components/hr/AddApplicantModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { updateApplicantStatus } from "@/app/actions/hr";

export default function ApplicantsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [applicants, setApplicants] = useState<
    any[]
  >([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();

    const channel = supabase
      .channel("applicants_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "applicant_management",
        },
        fetchApplicants,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("applicant_management")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setApplicants(data);
    setLoading(false);
  };

  const filteredApplicants = applicants.filter(
    (a) => {
      const nameMatch =
        `${a.first_name} ${a.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        a.email
          .toLowerCase()
          .includes(search.toLowerCase());
      const statusMatch =
        statusFilter === "all" ||
        a.status === statusFilter;
      return nameMatch && statusMatch;
    },
  );

  // Status Management State
  const [
    isInterviewModalOpen,
    setIsInterviewModalOpen,
  ] = useState(false);
  const [
    selectedApplicant,
    setSelectedApplicant,
  ] = useState<any>(null);
  const [interviewFormat, setInterviewFormat] =
    useState({
      date: "",
      time: "",
      location: "Google Meet Link",
    });

  const handleStatusChange = async (
    applicant: any,
    newStatus: string,
  ) => {
    if (newStatus === applicant.status) return;

    if (newStatus === "interview") {
      setSelectedApplicant(applicant);
      setIsInterviewModalOpen(true);
      return;
    }

    // Direct Status Update for non-interview statuses
    toast.promise(
      updateApplicantStatus(
        applicant.id,
        newStatus,
        applicant.email,
        applicant.first_name,
      ),
      {
        loading: "Updating status...",
        success: (result) => {
          if (result.success) {
            // Update local state for immediate UI reflection without waiting for realtime/refresh
            setApplicants((prev) =>
              prev.map((app) =>
                app.id === applicant.id
                  ? { ...app, status: newStatus }
                  : app,
              ),
            );
            return `Status updated to ${newStatus}. ${result.emailSent ? "Email notification sent." : ""}`;
          }
          throw new Error(result.error);
        },
        error: (err) =>
          err.message ||
          "Failed to update status.",
      },
    );
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplicant) return;

    toast.promise(
      updateApplicantStatus(
        selectedApplicant.id,
        "interview",
        selectedApplicant.email,
        selectedApplicant.first_name,
        interviewFormat.date,
        interviewFormat.time,
        interviewFormat.location,
      ),
      {
        loading: "Scheduling interview...",
        success: (result) => {
          setIsInterviewModalOpen(false);
          if (result.success) {
            // Update local state for immediate UI reflection
            setApplicants((prev) =>
              prev.map((app) =>
                app.id === selectedApplicant.id
                  ? {
                      ...app,
                      status: "interview",
                    }
                  : app,
              ),
            );
            return `Interview Scheduled! ${result.emailSent ? `Email sent to ${selectedApplicant.email}.` : ""}`;
          }
          throw new Error(result.error);
        },
        error: (err) =>
          err.message ||
          "Failed to schedule interview.",
      },
    );
  };

  const [viewingApplicant, setViewingApplicant] =
    useState<any>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Applicant Pool
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Applicant Pool
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Manage your incoming talent pipeline
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-end gap-3">
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px] h-10 bg-transparent border-slate-200 rounded-xl font-bold text-xs text-slate-600">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
            <SelectItem
              value="all"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              All Status
            </SelectItem>
            <SelectItem
              value="applied"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Applied
            </SelectItem>
            <SelectItem
              value="screening"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Screening
            </SelectItem>
            <SelectItem
              value="interview"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Interview
            </SelectItem>
            <SelectItem
              value="job offered"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Job Offered
            </SelectItem>
            <SelectItem
              value="hired"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Hired
            </SelectItem>
            <SelectItem
              value="rejected"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Rejected
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative group w-full md:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            placeholder="Search applicants..."
            className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-xl focus-visible:ring-blue-500 font-medium text-sm"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Candidate
                  </TableHead>
                  <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Email
                  </TableHead>
                  <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Applied On
                  </TableHead>
                  <TableHead className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-20 text-center animate-pulse font-black text-slate-300"
                    >
                      Loading Talent Pool...
                    </TableCell>
                  </TableRow>
                ) : filteredApplicants.length ===
                  0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest"
                    >
                      No applicants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplicants.map((a) => (
                    <TableRow
                      key={a.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold uppercase">
                            {a.first_name[0]}
                            {a.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {a.first_name}{" "}
                              {a.last_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Candidate
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-6 text-sm font-medium text-slate-600">
                        {a.email}
                      </TableCell>
                      <TableCell className="p-6">
                        <Select
                          value={a.status}
                          onValueChange={(val) =>
                            handleStatusChange(
                              a,
                              val,
                            )
                          }
                        >
                          <SelectTrigger
                            className={`h-8 w-[140px] text-[10px] font-black uppercase tracking-widest border-none ${
                              a.status ===
                              "applied"
                                ? "bg-blue-50 text-blue-600"
                                : a.status ===
                                    "screening"
                                  ? "bg-amber-50 text-amber-600"
                                  : a.status ===
                                      "interview"
                                    ? "bg-purple-50 text-purple-600"
                                    : a.status ===
                                        "job offered"
                                      ? "bg-indigo-50 text-indigo-600"
                                      : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applied">
                              Applied
                            </SelectItem>
                            <SelectItem value="screening">
                              Screening
                            </SelectItem>
                            <SelectItem value="interview">
                              Interview
                            </SelectItem>
                            <SelectItem value="job offered">
                              Job Offered
                            </SelectItem>
                            <SelectItem value="hired">
                              Hired
                            </SelectItem>
                            <SelectItem value="rejected">
                              Rejected
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-6 text-xs text-slate-500 font-medium">
                        {new Date(
                          a.created_at,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          {a.resume_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-9 px-3 rounded-xl font-black text-slate-400 hover:text-blue-600"
                            >
                              <a
                                href={`${a.resume_url}?download=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setViewingApplicant(
                                a,
                              )
                            }
                            className="h-9 px-3 rounded-xl font-black text-slate-900 hover:bg-slate-100"
                          >
                            View{" "}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={isInterviewModalOpen}
        onOpenChange={setIsInterviewModalOpen}
      >
        <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">
              Schedule Interview
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400">
              Set details for{" "}
              {selectedApplicant?.first_name}{" "}
              {selectedApplicant?.last_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Date
              </Label>
              <Input
                type="date"
                value={interviewFormat.date}
                onChange={(e) =>
                  setInterviewFormat({
                    ...interviewFormat,
                    date: e.target.value,
                  })
                }
                className="rounded-xl h-12 bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Time (e.g., 2:00 PM EST)
              </Label>
              <Input
                value={interviewFormat.time}
                onChange={(e) =>
                  setInterviewFormat({
                    ...interviewFormat,
                    time: e.target.value,
                  })
                }
                placeholder="2:00 PM EST"
                className="rounded-xl h-12 bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Location / Meeting Link
              </Label>
              <Input
                value={interviewFormat.location}
                onChange={(e) =>
                  setInterviewFormat({
                    ...interviewFormat,
                    location: e.target.value,
                  })
                }
                placeholder="https://meet.google.com/..."
                className="rounded-xl h-12 bg-slate-50 border-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button
              variant="ghost"
              onClick={() =>
                setIsInterviewModalOpen(false)
              }
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={
                !interviewFormat.date ||
                !interviewFormat.time ||
                !interviewFormat.location
              }
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20"
            >
              Confirm & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Applicant Documents Modal */}
      <Dialog
        open={viewingApplicant !== null}
        onOpenChange={(open) =>
          !open && setViewingApplicant(null)
        }
      >
        <DialogContent className="sm:max-w-3xl rounded-[32px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">
              Applicant Profile
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400">
              Reviewing documents and information
              for {viewingApplicant?.first_name}{" "}
              {viewingApplicant?.last_name}
            </DialogDescription>
          </DialogHeader>

          {viewingApplicant && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Contact Information
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="font-bold text-slate-900">
                      {viewingApplicant.email}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Application Details
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400">
                        Position
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {viewingApplicant.position ||
                          "Applicant"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400">
                        Applied On
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(
                          viewingApplicant.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400">
                        Current Status
                      </p>
                      <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">
                        {viewingApplicant.status}
                      </span>
                    </div>

                    {viewingApplicant.contact_number && (
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Contact Number
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {
                            viewingApplicant.contact_number
                          }
                        </p>
                      </div>
                    )}
                    {viewingApplicant.civil_status && (
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Civil Status
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {
                            viewingApplicant.civil_status
                          }
                        </p>
                      </div>
                    )}
                    {viewingApplicant.age && (
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Age
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {viewingApplicant.age}
                        </p>
                      </div>
                    )}
                    {viewingApplicant.birth_date && (
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Birth Date
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {
                            viewingApplicant.birth_date
                          }
                        </p>
                      </div>
                    )}
                    {viewingApplicant.parents_name && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Parents / Guardian
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {
                            viewingApplicant.parents_name
                          }
                        </p>
                      </div>
                    )}
                    {viewingApplicant.address && (
                      <div className="col-span-2 mt-2">
                        <p className="text-[10px] uppercase font-black text-slate-400">
                          Complete Address
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {
                            viewingApplicant.address
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2">
                    Submitted Documents
                  </h4>

                  {viewingApplicant.resume_url ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            Resume / CV
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">
                            External Link
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        <a
                          href={
                            viewingApplicant.resume_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400">
                        No documents uploaded.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
