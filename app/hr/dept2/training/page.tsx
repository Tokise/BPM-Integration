"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus,
  Search,
  ChevronLeft,
  Users,
  MapPin,
  UserCheck,
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
import { CertificateModal } from "@/components/hr/CertificateModal";
import {
  notifyEmployeeEnrollment,
  updateEnrollmentStatus,
  updateBlueprintStatus,
} from "@/app/actions/hr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrainingManagementPage() {
  const supabase = createClient();
  const router = useRouter();

  const [trainings, setTrainings] = useState<
    any[]
  >([]);
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [trainingEvents, setTrainingEvents] =
    useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] =
    useState(false);
  const [
    isAssignModalOpen,
    setIsAssignModalOpen,
  ] = useState(false);

  const [newEvent, setNewEvent] = useState({
    event_name: "",
    description: "",
    category: "",
    trainer_name: "",
    location: "",
    duration: "",
  });

  const [assignForm, setAssignForm] = useState({
    event_id: "",
    employee_id: "",
    scheduled_date: "",
  });

  const [selectedCert, setSelectedCert] =
    useState<any>(null);
  const [isCertModalOpen, setIsCertModalOpen] =
    useState(false);
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  useEffect(() => {
    fetchData();

    const channel1 = supabase
      .channel("training_sync_updated")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "training_management",
        },
        fetchData,
      )
      .subscribe();

    const channel2 = supabase
      .channel("event_sync_updated")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "training_events",
        },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trnRes, eventRes, empRes] =
        await Promise.all([
          supabase
            .schema("bpm-anec-global")
            .from("training_management")
            .select(
              `
            id,
            training_name,
            employee_id,
            employee_name,
            status,
            completion_date,
            trainer_name,
            location,
            attendance_status,
            training_result,
            profiles(full_name, role)
          `,
            )
            .is("course_id", null)
            .order("created_at", {
              ascending: false,
            }),
          supabase
            .schema("bpm-anec-global")
            .from("training_events")
            .select("*")
            .order("created_at", {
              ascending: false,
            }),
          supabase
            .schema("bpm-anec-global")
            .from("profiles")
            .select("id, full_name, role, email")
            .in("role", [
              "employee",
              "HR",
              "Admin",
              "Finance",
              "Logistics",
              "hr",
              "admin",
              "finance",
              "logistics",
              "Employee",
            ])
            .order("full_name"),
        ]);

      if (trnRes.data) setTrainings(trnRes.data);
      if (eventRes.data)
        setTrainingEvents(eventRes.data);
      if (empRes.data) setEmployees(empRes.data);
    } catch (error) {
      console.error(
        "Error fetching training data:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !newEvent.event_name ||
      !newEvent.category
    ) {
      return toast.error(
        "Event name and category are required.",
      );
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("training_events")
        .insert({
          event_name: newEvent.event_name,
          description: newEvent.description,
          category: newEvent.category,
          trainer_name: newEvent.trainer_name,
          location: newEvent.location,
          duration: newEvent.duration,
        });

      if (error) throw error;

      toast.success("Training event published!");
      setIsEventModalOpen(false);
      setNewEvent({
        event_name: "",
        description: "",
        category: "",
        trainer_name: "",
        location: "",
        duration: "",
      });
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message || "Failed to add event.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTraining = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !assignForm.event_id ||
      !assignForm.employee_id
    ) {
      return toast.error(
        "Please select an event and an employee.",
      );
    }

    setSubmitting(true);
    const selectedEvent = trainingEvents.find(
      (ev) => ev.id === assignForm.event_id,
    );
    const selectedEmp = employees.find(
      (emp) => emp.id === assignForm.employee_id,
    );

    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("training_management")
        .insert({
          employee_id: assignForm.employee_id,
          employee_name:
            selectedEmp?.full_name || "Unknown",
          training_name:
            selectedEvent?.event_name ||
            "Training",
          event_id: assignForm.event_id,
          status: "Scheduled",
          completion_date:
            assignForm.scheduled_date || null,
          trainer_name:
            selectedEvent?.trainer_name,
          location: selectedEvent?.location,
          attendance_status: "Pending",
        });

      if (error) throw error;

      if (selectedEmp) {
        await notifyEmployeeEnrollment(
          selectedEmp.id,
          selectedEmp.email,
          selectedEmp.full_name,
          selectedEvent?.event_name ||
            "New Training",
          "training",
        );
      }

      toast.success(
        "Employee enrolled successfully!",
      );
      setIsAssignModalOpen(false);
      setAssignForm({
        event_id: "",
        employee_id: "",
        scheduled_date: "",
      });
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to assign training.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBlueprintStatus = async (
    id: string,
    currentStatus: string,
  ) => {
    const newStatus =
      currentStatus === "Active"
        ? "Archived"
        : "Active";
    const tid = toast.loading(
      `Changing event status to ${newStatus}...`,
    );
    try {
      const res = await updateBlueprintStatus(
        "training",
        id,
        newStatus,
      );
      if (res.success) {
        toast.success(
          `Event marked as ${newStatus}`,
          { id: tid },
        );
        fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(
        err.message || "Failed to update status",
        { id: tid },
      );
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: string,
  ) => {
    const tid = toast.loading(
      "Updating status...",
    );
    try {
      const res = await updateEnrollmentStatus(
        id,
        newStatus,
      );
      if (res.success) {
        toast.success(
          `Training marked as ${newStatus}`,
          { id: tid },
        );
        fetchData();
      } else {
        throw new Error(
          res.error || "Failed to update status",
        );
      }
    } catch (err: any) {
      toast.error(
        err.message || "Failed to update status",
        { id: tid },
      );
    }
  };
  const filteredTraining = trainings.filter(
    (t) => {
      const emp = (
        t.profiles?.full_name ||
        t.employee_name ||
        ""
      ).toLowerCase();
      const trn = (
        t.training_name || ""
      ).toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        emp.includes(q) || trn.includes(q);
      const matchesCategory =
        categoryFilter === "all" ||
        t.training_events?.category ===
          categoryFilter;
      return matchesSearch && matchesCategory;
    },
  );

  const filteredEvents = trainingEvents.filter(
    (ev) => {
      const name = (
        ev.event_name || ""
      ).toLowerCase();
      const desc = (
        ev.description || ""
      ).toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        name.includes(q) || desc.includes(q);
      const matchesCategory =
        categoryFilter === "all" ||
        ev.category === categoryFilter;
      return matchesSearch && matchesCategory;
    },
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/hr/dept2">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                Training Management
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              Live Training Management
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 pr-11">
              Workshops & synchronous session
              blueprints
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog
              open={isAssignModalOpen}
              onOpenChange={setIsAssignModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-black rounded-xl h-11 px-6">
                  <Users className="h-4 w-4 mr-2" />
                  Enroll Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
                <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
                  <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-600" />
                    Enroll Participant
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                    Map an employee to a scheduled
                    event
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleAssignTraining}
                  className="p-6 md:p-8 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Select Event
                      </Label>
                      <select
                        value={
                          assignForm.event_id
                        }
                        onChange={(e) =>
                          setAssignForm({
                            ...assignForm,
                            event_id:
                              e.target.value,
                          })
                        }
                        className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="" disabled>
                          Choose an event...
                        </option>
                        {trainingEvents.map(
                          (ev) => (
                            <option
                              key={ev.id}
                              value={ev.id}
                            >
                              {ev.event_name} (
                              {ev.category})
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Target Employee
                      </Label>
                      <select
                        value={
                          assignForm.employee_id
                        }
                        onChange={(e) =>
                          setAssignForm({
                            ...assignForm,
                            employee_id:
                              e.target.value,
                          })
                        }
                        className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="" disabled>
                          Select participant...
                        </option>
                        {employees.map((emp) => (
                          <option
                            key={emp.id}
                            value={emp.id}
                          >
                            {emp.full_name ||
                              "Unknown"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Scheduled Date
                      </Label>
                      <Input
                        type="date"
                        value={
                          assignForm.scheduled_date
                        }
                        onChange={(e) =>
                          setAssignForm({
                            ...assignForm,
                            scheduled_date:
                              e.target.value,
                          })
                        }
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-base"
                  >
                    {submitting
                      ? "Processing..."
                      : "Confirm Enrollment"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isEventModalOpen}
              onOpenChange={setIsEventModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Make a Blueprint
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
                <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
                  <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Event Blueprint
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                    Create a recurring live
                    workshop profile
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleCreateEvent}
                  className="p-6 md:p-8 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Event Name
                      </Label>
                      <Input
                        required
                        value={
                          newEvent.event_name
                        }
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            event_name:
                              e.target.value,
                          })
                        }
                        placeholder="e.g. Leadership Masterclass"
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Category
                      </Label>
                      <select
                        value={newEvent.category}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            category:
                              e.target.value,
                          })
                        }
                        className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        {[
                          "Technical",
                          "Leadership",
                          "Soft Skills",
                          "Safety",
                        ].map((cat) => (
                          <option
                            key={cat}
                            value={cat}
                          >
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                          Trainer
                        </Label>
                        <Input
                          value={
                            newEvent.trainer_name
                          }
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              trainer_name:
                                e.target.value,
                            })
                          }
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-blue-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                          Duration
                        </Label>
                        <Input
                          value={
                            newEvent.duration
                          }
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              duration:
                                e.target.value,
                            })
                          }
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Location
                      </Label>
                      <Input
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            location:
                              e.target.value,
                          })
                        }
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-base"
                  >
                    {submitting
                      ? "Publishing..."
                      : "Publish Blueprint"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-end gap-3">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-full md:w-[180px] h-10 bg-transparent border-slate-200 rounded-lg font-bold text-xs text-slate-600">
              <SelectValue placeholder="Filter Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              <SelectItem
                value="all"
                className="font-bold text-xs uppercase tracking-widest p-3"
              >
                All Categories
              </SelectItem>
              {Array.from(
                new Set(
                  trainingEvents.map(
                    (ev) => ev.category,
                  ),
                ),
              )
                .filter(Boolean)
                .map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="font-bold text-xs uppercase tracking-widest p-3"
                  >
                    {cat}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="relative group w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              placeholder="Search trainings..."
              className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-lg focus-visible:ring-blue-500 font-medium text-sm"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="events"
          className="w-full"
        >
          <TabsList className="bg-slate-200/50 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger
              value="events"
              className="rounded-xl font-black h-full px-8 text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all"
            >
              Training Catalog
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="rounded-xl font-black h-full px-8 text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all"
            >
              Active Participants (
              {trainings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="events"
            className="focus:outline-none"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-white rounded-[32px] animate-pulse shadow-sm"
                  />
                ))
              ) : trainingEvents.length > 0 ? (
                trainingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="border border-slate-100 p-6 shadow-sm rounded-xl hover:border-blue-200 transition-colors bg-white group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border border-slate-100">
                          {ev.category}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                          {ev.event_name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2">
                          {ev.description ||
                            "Live workshop session."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between py-4 border-y border-slate-50 gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />{" "}
                          {ev.duration || "TBD"}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            ev.status ===
                            "Archived"
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {ev.status || "Active"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black">
                            {ev.trainer_name?.charAt(
                              0,
                            ) || "TR"}
                          </div>
                          <span className="text-xs font-bold text-slate-600 truncate">
                            {ev.trainer_name ||
                              "Internal"}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                          >
                            <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-slate-100 shadow-xl"
                          >
                            <DropdownMenuItem
                              className="font-black text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer"
                              onClick={() =>
                                handleUpdateBlueprintStatus(
                                  ev.id,
                                  ev.status ||
                                    "Active",
                                )
                              }
                            >
                              {ev.status ===
                              "Archived"
                                ? "Activate Event"
                                : "Archive Event"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50">
                  <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                    No Events Published
                  </p>
                  <p className="text-slate-400 text-xs mt-3 font-medium">
                    Create an event blueprint to
                    get started.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="participants"
            className="focus:outline-none"
          >
            <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Employee
                    </TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Live Training Event
                    </TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">
                      Logistics
                    </TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow
                        key={i}
                        className="animate-pulse"
                      >
                        <TableCell
                          colSpan={5}
                          className="px-8 py-6 h-20 bg-white/50"
                        />
                      </TableRow>
                    ))
                  ) : filteredTraining.length >
                    0 ? (
                    filteredTraining.map((t) => (
                      <TableRow
                        key={t.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 block truncate">
                                {t.profiles
                                  ?.full_name ||
                                  t.employee_name ||
                                  "Unknown"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block truncate mt-0.5">
                                {t.profiles
                                  ?.role ||
                                  "Employee"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5 max-w-[200px]">
                          <div className="font-bold text-slate-700 truncate">
                            {t.training_name}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />{" "}
                            {t.completion_date ||
                              "TBD"}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5 hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                              <Users className="h-3 w-3 text-slate-400" />{" "}
                              {t.trainer_name ||
                                "Internal"}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              <MapPin className="h-3 w-3" />{" "}
                              {t.location ||
                                "TBD"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              t.status ===
                              "Completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : t.status ===
                                      "Scheduled" ||
                                    t.status ===
                                      "Pending"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {(
                              t.status || ""
                            ).replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {t.status !==
                              "Completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleUpdateStatus(
                                    t.id,
                                    "Completed",
                                  )
                                }
                                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-3"
                              >
                                Mark Complete
                              </Button>
                            )}
                            {t.status ===
                              "Completed" && (
                              <span className="text-[10px] font-bold text-slate-400 block mt-1 italic">
                                Certificate
                                available in
                                Social Recognition
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl border-slate-100 shadow-xl"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(
                                      t.id,
                                      "Did Not Attend",
                                    )
                                  }
                                  className="text-rose-600 font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                                >
                                  Mark DNA
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-16 text-center text-slate-400 font-bold tracking-widest uppercase text-xs"
                      >
                        No active participants
                        found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedCert && (
        <CertificateModal
          open={isCertModalOpen}
          onOpenChange={setIsCertModalOpen}
          employeeName={selectedCert.employeeName}
          achievementTitle={
            selectedCert.achievementTitle
          }
          date={selectedCert.date}
        />
      )}
    </div>
  );
}
