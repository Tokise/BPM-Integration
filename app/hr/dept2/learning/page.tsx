"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Search,
  Plus,
  PlayCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  Users,
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

export default function LearningManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>(
    [],
  );
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [enrollments, setEnrollments] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    isCourseModalOpen,
    setIsCourseModalOpen,
  ] = useState(false);
  const [
    isAssignModalOpen,
    setIsAssignModalOpen,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [newCourse, setNewCourse] = useState({
    course_name: "",
    description: "",
    category: "",
    duration: "",
    instructor: "",
    course_url: "",
  });

  const [assignForm, setAssignForm] = useState({
    course_id: "",
    employee_id: "",
  });

  const [selectedCert, setSelectedCert] =
    useState<any>(null);
  const [isCertModalOpen, setIsCertModalOpen] =
    useState(false);

  useEffect(() => {
    fetchData();

    // Listen to changes on both courses and training_management (enrollments)
    const channel1 = supabase
      .channel("learning_sync_updated")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "learning_management",
        },
        fetchData,
      )
      .subscribe();

    const channel2 = supabase
      .channel("enrollment_sync_updated")
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

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, empRes, enrollRes] =
        await Promise.all([
          supabase
            .schema("bpm-anec-global")
            .from("learning_management")
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
          supabase
            .schema("bpm-anec-global")
            .from("training_management")
            .select(
              `
            id,
            employee_id,
            employee_name,
            training_name,
            status,
            completion_date,
            course_id,
            profiles(id, full_name, role, email)
          `,
            )
            .not("course_id", "is", null), // Fetch only e-learning enrollments
        ]);

      if (coursesRes.data)
        setCourses(coursesRes.data);
      if (empRes.data) setEmployees(empRes.data);
      if (enrollRes.data)
        setEnrollments(enrollRes.data);
    } catch (error) {
      console.error(
        "Error fetching learning data:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !newCourse.course_name ||
      !newCourse.category
    ) {
      toast.error(
        "Course name and category are required",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("learning_management")
        .insert({
          course_name: newCourse.course_name,
          description: newCourse.description,
          category: newCourse.category,
          duration: newCourse.duration,
          instructor: newCourse.instructor,
          course_url: newCourse.course_url,
        });

      if (error) throw error;

      toast.success(
        "Course published successfully!",
      );
      setIsCourseModalOpen(false);
      setNewCourse({
        course_name: "",
        description: "",
        category: "",
        duration: "",
        instructor: "",
        course_url: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to publish course",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCourse = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !assignForm.course_id ||
      !assignForm.employee_id
    ) {
      toast.error(
        "Please select a course and an employee",
      );
      return;
    }

    setSubmitting(true);
    const selectedCourse = courses.find(
      (c) => c.id === assignForm.course_id,
    );
    const selectedEmp = employees.find(
      (emp) => emp.id === assignForm.employee_id,
    );

    try {
      // We use the training_management table as the ledger for learning enrollments
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("training_management")
        .insert({
          employee_id: assignForm.employee_id,
          employee_name:
            selectedEmp?.full_name || "Unknown",
          training_name:
            selectedCourse?.course_name ||
            "Online Course",
          course_id: assignForm.course_id,
          status: "Pending", // Pending means mapped but not started
        });

      if (error) throw error;

      // Send Notification and Email
      if (selectedEmp) {
        await notifyEmployeeEnrollment(
          selectedEmp.id,
          selectedEmp.email,
          selectedEmp.full_name,
          selectedCourse?.course_name ||
            "New Course",
          "course",
        );
      }

      toast.success(
        "Employee enrolled successfully!",
      );
      setIsAssignModalOpen(false);
      setAssignForm({
        course_id: "",
        employee_id: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to assign course",
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
      `Changing course status to ${newStatus}...`,
    );
    try {
      const res = await updateBlueprintStatus(
        "course",
        id,
        newStatus,
      );
      if (res.success) {
        toast.success(
          `Course marked as ${newStatus}`,
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

  const filteredCourses = courses.filter((c) => {
    const term = searchQuery.toLowerCase();
    return (
      (c.course_name || "")
        .toLowerCase()
        .includes(term) ||
      (c.category || "")
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() =>
                router.push("/hr/dept2")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 bg-white">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-600" />
              Learning Management
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 pl-11">
              Course blueprints & employee
              assignments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog
              open={isAssignModalOpen}
              onOpenChange={setIsAssignModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-black rounded-xl h-11 px-6">
                  <Users className="h-4 w-4 mr-2" />{" "}
                  Assign Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
                <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
                  <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-600" />{" "}
                    Enroll Employee
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                    Map an employee to an existing
                    course
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleAssignCourse}
                  className="p-6 md:p-8 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Select Course
                      </Label>
                      <select
                        value={
                          assignForm.course_id
                        }
                        onChange={(e) =>
                          setAssignForm({
                            ...assignForm,
                            course_id:
                              e.target.value,
                          })
                        }
                        className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="" disabled>
                          Choose a course...
                        </option>
                        {courses.map((course) => (
                          <option
                            key={course.id}
                            value={course.id}
                          >
                            {course.course_name} (
                            {course.category})
                          </option>
                        ))}
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
                          Select an employee...
                        </option>
                        {employees.map((emp) => (
                          <option
                            key={emp.id}
                            value={emp.id}
                          >
                            {emp.full_name ||
                              "Unknown"}{" "}
                            - {emp.role}
                          </option>
                        ))}
                      </select>
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
              open={isCourseModalOpen}
              onOpenChange={setIsCourseModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-purple-500/20">
                  <Plus className="h-4 w-4 mr-2" />{" "}
                  Make a Blueprint
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
                <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
                  <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-purple-600" />{" "}
                    Publish Course
                  </DialogTitle>
                  <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                    Create a new asynchronous
                    learning block
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleCreateCourse}
                  className="p-6 md:p-8 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Course Title
                      </Label>
                      <Input
                        required
                        value={
                          newCourse.course_name
                        }
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            course_name:
                              e.target.value,
                          })
                        }
                        placeholder="e.g. Advanced Security Protocols"
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Category
                      </Label>
                      <select
                        value={newCourse.category}
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            category:
                              e.target.value,
                          })
                        }
                        className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        {[
                          "Technical",
                          "Leadership",
                          "Compliance",
                          "Soft Skills",
                          "Onboarding",
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
                          Duration
                        </Label>
                        <Input
                          value={
                            newCourse.duration
                          }
                          onChange={(e) =>
                            setNewCourse({
                              ...newCourse,
                              duration:
                                e.target.value,
                            })
                          }
                          placeholder="e.g. 4 Hours"
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                          Instructor
                        </Label>
                        <Input
                          value={
                            newCourse.instructor
                          }
                          onChange={(e) =>
                            setNewCourse({
                              ...newCourse,
                              instructor:
                                e.target.value,
                            })
                          }
                          placeholder="e.g. Bob Smith"
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Short Description
                      </Label>
                      <Input
                        value={
                          newCourse.description
                        }
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            description:
                              e.target.value,
                          })
                        }
                        placeholder="Brief overview of course..."
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                        Course URL (Optional)
                      </Label>
                      <Input
                        value={
                          newCourse.course_url
                        }
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            course_url:
                              e.target.value,
                          })
                        }
                        placeholder="e.g. https://example.com/course"
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 transition-all active:scale-95 text-base"
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

        {/* Filters/Search */}
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
          <Input
            placeholder="Search courses or categories..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-purple-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        {/* Tabs for Blueprints vs Active Enrollments */}
        <Tabs
          defaultValue="courses"
          className="w-full"
        >
          <TabsList className="bg-slate-200/50 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger
              value="courses"
              className="rounded-xl font-black h-full px-8 text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all"
            >
              Course Catalog
            </TabsTrigger>
            <TabsTrigger
              value="enrollments"
              className="rounded-xl font-black h-full px-8 text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all"
            >
              Active Enrollments (
              {enrollments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="courses"
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
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-slate-100 p-6 shadow-xl shadow-slate-100/30 rounded-[32px] hover:border-purple-200 transition-colors bg-white group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border border-slate-100">
                          {course.category}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                          {course.course_name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2">
                          {course.description ||
                            "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between py-4 border-y border-slate-50 gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />{" "}
                          {course.duration ||
                            "Self-Paced"}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            course.status ===
                            "Archived"
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {course.status ||
                            "Active"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black">
                            {course.instructor?.charAt(
                              0,
                            ) || "NA"}
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {course.instructor ||
                              "Self-Guided"}
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
                                  course.id,
                                  course.status ||
                                    "Active",
                                )
                              }
                            >
                              {course.status ===
                              "Archived"
                                ? "Activate Course"
                                : "Archive Course"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50">
                  <PlayCircle className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                    No courses published
                  </p>
                  <p className="text-slate-400 text-xs mt-3 font-medium">
                    Create a new course blueprint
                    to get started.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="enrollments"
            className="focus:outline-none"
          >
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-100/50 overflow-hidden border border-slate-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Employee
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Course
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Enrolled On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 relative">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-16 text-center text-slate-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : enrollments.length > 0 ? (
                    enrollments.map((enr) => (
                      <tr
                        key={enr.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-5">
                          <span className="font-black text-slate-900 block">
                            {enr.profiles
                              ?.full_name ||
                              enr.employee_name ||
                              "Unknown"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {enr.profiles?.role ||
                              "Employee"}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-700">
                          {enr.training_name}
                        </td>
                        <td className="px-8 py-5">
                          <select
                            value={enr.status}
                            onChange={async (
                              e,
                            ) => {
                              const tid =
                                toast.loading(
                                  "Updating status...",
                                );
                              const res =
                                await updateEnrollmentStatus(
                                  enr.id,
                                  e.target.value,
                                );
                              if (res.success) {
                                toast.success(
                                  "Status updated!",
                                  { id: tid },
                                );
                                fetchData();
                              } else {
                                toast.error(
                                  "Failed to update status",
                                  { id: tid },
                                );
                              }
                            }}
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                              enr.status ===
                              "Completed"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-purple-50 text-purple-600 border-purple-100"
                            } focus:outline-none focus:ring-2 focus:ring-purple-500 bg-transparent`}
                          >
                            <option value="Pending">
                              Pending
                            </option>
                            <option value="In Progress">
                              In Progress
                            </option>
                            <option value="Completed">
                              Completed
                            </option>
                            <option value="Archived">
                              Archived
                            </option>
                          </select>
                        </td>
                        <td className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase">
                          <div className="flex items-center justify-end gap-2">
                            {enr.status ===
                              "Completed" && (
                              <span className="text-[10px] font-bold text-slate-400 block mt-1 italic">
                                Certificate
                                available in
                                Social Recognition
                              </span>
                            )}
                            <span>
                              {enr.completion_date
                                ? enr.completion_date
                                : "In Progress"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-16 text-center text-sm font-black text-slate-400 tracking-widest uppercase"
                      >
                        No active enrollments
                        recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
