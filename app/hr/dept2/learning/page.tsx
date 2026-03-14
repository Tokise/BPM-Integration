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
  Zap,
  GraduationCap,
  PlayCircle,
  FileText,
  Clock,
  User,
  MoreVertical,
  ChevronLeft,
  Users,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TabsList,
  TabsTrigger,
  TabsContent,
  Tabs,
} from "@/components/ui/tabs";

export default function LearningManagementPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isDept1 =
    pathname.startsWith("/hr/dept1");
  const baseUrl = isDept1
    ? "/hr/dept1"
    : "/hr/dept2";

  // Role Access Checks
  const isHR2Admin = profile?.role === "hr2_admin";
  const isHR3Admin = profile?.role === "hr3_admin";
  const isPlatformAdmin = profile?.role === "admin";
  
  // Can Create/Manage Courses: HR2 Admin, HR3 Admin (per specific request), Platform Admin
  const canManageCourses = isHR2Admin || isHR3Admin || isPlatformAdmin;
  
  // Read-Only Roles (Integrated): Log, Fin, HR1, HR4
  const isReadOnlyRole = !isHR2Admin && !isHR3Admin && !isPlatformAdmin;

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
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [
    isCourseModalOpen,
    setIsCourseModalOpen,
  ] = useState(false);
  const [
    isQuizModalOpen,
    setIsQuizModalOpen,
  ] = useState(false);
  const [
    isAssignModalOpen,
    setIsAssignModalOpen,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [newCourse, setNewCourse] = useState<any>(
    {
      course_name: "",
      description: "",
      category: "",
      duration: "",
      instructor: "",
      course_url: "",
      auto_assign_dept_id: "none",
      has_quiz: false,
      lessons: [],
      quiz: {
        passing_score: 70,
        questions: [],
      },
    },
  );

  const [assignForm, setAssignForm] = useState({
    course_id: "",
    employee_id: "",
  });

  const [selectedCert, setSelectedCert] =
    useState<any>(null);
  const [isCertModalOpen, setIsCertModalOpen] =
    useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        coursesRes,
        empRes,
        enrollRes,
        deptRes,
      ] = await Promise.all([
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
        supabase
          .schema("bpm-anec-global")
          .from("departments")
          .select("id, name")
          .order("name"),
      ]);

      if (coursesRes.data) {
        let filteredCourses = coursesRes.data;
        if (
          profile?.role === "hr1_admin" ||
          profile?.role === "hr1_employee"
        ) {
          // Filter courses to only those the user is enrolled in
          const enrolledCourseIds = (
            enrollRes.data || []
          )
            .filter(
              (e) =>
                e.employee_id === profile?.id,
            )
            .map((e) => e.course_id);

          filteredCourses =
            filteredCourses.filter((c) =>
              enrolledCourseIds.includes(c.id),
            );
        }
        setCourses(filteredCourses);
      }
      if (empRes.data) setEmployees(empRes.data);
      if (deptRes.data)
        setDepartments(deptRes.data);
      if (enrollRes.data) {
        let filteredEnrollments = enrollRes.data;
        if (
          profile?.role === "hr1_admin" ||
          profile?.role === "hr1_employee"
        ) {
          filteredEnrollments =
            filteredEnrollments.filter(
              (e) =>
                e.employee_id === profile?.id,
            );
        }
        setEnrollments(filteredEnrollments);
      }
    } catch (error) {
      console.error(
        "Error fetching learning data:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

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

  const handleSyncEnrollments = async () => {
    const tid = toast.loading(
      "Syncing department assignments...",
    );
    try {
      // 1. Get all courses with auto-assign
      const { data: blueprints, error: bError } =
        await supabase
          .schema("bpm-anec-global")
          .from("learning_management")
          .select("*")
          .not("auto_assign_dept_id", "is", null)
          .eq("status", "Active");

      if (bError) throw bError;
      if (
        !blueprints ||
        blueprints.length === 0
      ) {
        toast.info(
          "No active courses with auto-assignment found",
          { id: tid },
        );
        return;
      }

      let totalEnrolled = 0;

      for (const blueprint of blueprints) {
        // 2. Find employees in this department
        const {
          data: departmentEmps,
          error: eError,
        } = await supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id, email, full_name")
          .eq(
            "dept_id",
            blueprint.auto_assign_dept_id,
          ); // Corrected from department_id to dept_id

        if (eError) throw eError;
        if (
          !departmentEmps ||
          departmentEmps.length === 0
        )
          continue;

        // 3. Get existing enrollments for this course
        const { data: existingEnrollments } =
          await supabase
            .schema("bpm-anec-global")
            .from("training_management")
            .select("employee_id")
            .eq("course_id", blueprint.id);

        const enrolledIds = new Set(
          existingEnrollments?.map(
            (e) => e.employee_id,
          ) || [],
        );

        // 4. Enroll those who aren't yet
        const newcomers = departmentEmps.filter(
          (emp) => !enrolledIds.has(emp.id),
        );

        if (newcomers.length > 0) {
          const enrollmentsToInsert =
            newcomers.map((emp) => ({
              employee_id: emp.id,
              course_id: blueprint.id,
              training_name:
                blueprint.course_name, // Corrected from course_name to training_name
              status: "Scheduled",
              progress: 0,
              instructor_name:
                blueprint.instructor,
              employee_name: emp.full_name, // Added employee_name
            }));

          const { error: insError } =
            await supabase
              .schema("bpm-anec-global")
              .from("training_management")
              .insert(enrollmentsToInsert);

          if (insError) throw insError;

          // 5. Notify
          for (const emp of newcomers) {
            await notifyEmployeeEnrollment(
              emp.id,
              emp.email || "",
              emp.full_name || "Employee",
              blueprint.course_name ||
                "New Course",
              "course",
            );
          }
          totalEnrolled += newcomers.length;
        }
      }

      toast.success(
        `Sync complete! Enrolled ${totalEnrolled} employees into relevant courses.`,
        { id: tid },
      );
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Sync failed", {
        id: tid,
      });
    }
  };

  const launchViewer = (
    courseId: string,
  ) => {
    router.push(`/hr/learning-viewer/${courseId}`);
  };


  const loadCourseIntoState = async (course: any) => {
    // 1. Set initial state with basic info
    setNewCourse({
      ...course,
      auto_assign_dept_id: course.auto_assign_dept_id || "none",
      lessons: [],
      quiz: {
        passing_score: 70,
        questions: [],
      },
    });

    try {
      // 2. Fetch Lessons
      const { data: lessons, error: lError } = await supabase
        .schema("bpm-anec-global")
        .from("learning_lessons")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index");

      if (lError) throw lError;

      // 3. Fetch Quiz
      const { data: quizData } = await supabase
        .schema("bpm-anec-global")
        .from("learning_quizzes")
        .select("*, questions:learning_quiz_questions(*)")
        .eq("course_id", course.id)
        .maybeSingle();

      setNewCourse((prev: any) => {
        // Only update if we're still looking at the same course
        if (prev.id !== course.id) return prev;
        return {
          ...prev,
          lessons: lessons || [],
          quiz: quizData
            ? {
                passing_score: quizData.passing_score,
                questions: quizData.questions || [],
              }
            : prev.quiz,
        };
      });
    } catch (err) {
      console.error("Error loading course details:", err);
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
      // 1. Create or Update the course record
      const coursePayload = {
        course_name: newCourse.course_name,
        description: newCourse.description,
        category: newCourse.category,
        duration: newCourse.duration,
        instructor: newCourse.instructor,
        course_url: newCourse.course_url,
        auto_assign_dept_id:
          newCourse.auto_assign_dept_id === "none"
            ? null
            : newCourse.auto_assign_dept_id,
        has_quiz: newCourse.has_quiz,
      };

      let courseData;
      if (newCourse.id) {
        const { data: updated, error } =
          await supabase
            .schema("bpm-anec-global")
            .from("learning_management")
            .update(coursePayload)
            .eq("id", newCourse.id)
            .select()
            .single();
        if (error) throw error;
        courseData = updated;
      } else {
        const { data: inserted, error } =
          await supabase
            .schema("bpm-anec-global")
            .from("learning_management")
            .insert(coursePayload)
            .select()
            .single();
        if (error) throw error;
        courseData = inserted;
      }

      const courseId = courseData.id;

      // 2. Insert/Update Lessons
      // Always clear lessons first if it's an update to ensure sync
      if (newCourse.id) {
        const { error: delError } = await supabase
          .schema("bpm-anec-global")
          .from("learning_lessons")
          .delete()
          .eq("course_id", newCourse.id);
        if (delError) throw delError;
      }

      if (newCourse.lessons?.length > 0) {
        const lessonsToInsert = newCourse.lessons.map(
          (lesson: any, index: number) => ({
            course_id: courseId,
            title: lesson.title || "Untitled Lesson",
            description: lesson.description || "",
            content_type: lesson.content_type || "text",
            file_url: lesson.file_url || "",
            youtube_url: lesson.youtube_url || "",
            order_index: index,
          }),
        );

        const { error: lessonError } = await supabase
          .schema("bpm-anec-global")
          .from("learning_lessons")
          .insert(lessonsToInsert);

        if (lessonError) throw lessonError;
      }

      // 3. Insert/Update Quiz
      // Always clear existing quiz first to ensure clean state
      if (newCourse.id) {
        const { data: oldQuiz } = await supabase
          .schema("bpm-anec-global")
          .from("learning_quizzes")
          .select("id")
          .eq("course_id", newCourse.id)
          .maybeSingle();

        if (oldQuiz) {
          // Delete questions first due to FK
          await supabase
            .schema("bpm-anec-global")
            .from("learning_quiz_questions")
            .delete()
            .eq("quiz_id", oldQuiz.id);
          
          await supabase
            .schema("bpm-anec-global")
            .from("learning_quizzes")
            .delete()
            .eq("id", oldQuiz.id);
        }
      }

      // Re-insert if enabled and has questions
      if (
        newCourse.has_quiz &&
        newCourse.quiz?.questions?.length > 0
      ) {
        const {
          data: quizData,
          error: quizError,
        } = await supabase
          .schema("bpm-anec-global")
          .from("learning_quizzes")
          .insert({
            course_id: courseId,
            passing_score:
              newCourse.quiz?.passing_score || 80,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        const questionsToInsert =
          newCourse.quiz?.questions?.map(
            (q: any) => ({
              quiz_id: quizData.id,
              question_text: q.question_text || "Untitled Question",
              options: q.options || ["", "", "", ""],
              correct_answer_index:
                q.correct_answer_index || 0,
            }),
          );

        const { error: questionsError } =
          await supabase
            .schema("bpm-anec-global")
            .from("learning_quiz_questions")
            .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      // 4. Auto-assignment logic
      if (
        newCourse.auto_assign_dept_id !== "none"
      ) {
        // Fetch employees in that department
        const { data: deptEmps } = await supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("id, full_name, email")
          .eq(
            "dept_id",
            newCourse.auto_assign_dept_id,
          );

        if (deptEmps && deptEmps.length > 0) {
          const enrollmentsToInsert =
            deptEmps.map((emp) => ({
              employee_id: emp.id,
              employee_name: emp.full_name,
              training_name:
                newCourse.course_name,
              course_id: courseData.id,
              status: "Pending",
            }));

          await supabase
            .schema("bpm-anec-global")
            .from("training_management")
            .insert(enrollmentsToInsert);

          // Notify employees (Fire and forget or batch)
          deptEmps.forEach((emp) => {
            notifyEmployeeEnrollment(
              emp.id,
              emp.email,
              emp.full_name,
              newCourse.course_name,
              "course",
            );
          });
        }
      }

      toast.success(
        "Course published and configured successfully!",
      );
      setIsCourseModalOpen(false);
      setNewCourse({
        course_name: "",
        description: "",
        category: "",
        duration: "",
        instructor: "",
        course_url: "",
        auto_assign_dept_id: "none",
        has_quiz: false,
        lessons: [],
        quiz: {
          passing_score: 70,
          questions: [],
        },
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

  const handleAddLesson = () => {
    setNewCourse((prev: any) => ({
      ...prev,
      lessons: [
        ...(prev.lessons || []),
        {
          title: "",
          content_type: "text",
          description: "",
          file_url: "",
          youtube_url: "",
        },
      ],
    }));
  };

  const handleLessonFileUpload = async (
    index: number,
    file: File,
  ) => {
    const tid = toast.loading(
      `Uploading ${file.name}...`,
    );
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      // We'll use 'multimedia' bucket. If it fails, we fall back to manual URL
      const { data, error } = await supabase.storage
        .from("multimedia")
        .upload(filePath, file);

      if (error) {
        if (error.message.includes("not found")) {
          throw new Error(
            "Upload bucket 'multimedia' not found. Please contact admin.",
          );
        }
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("multimedia")
        .getPublicUrl(filePath);

      handleUpdateLesson(index, "file_url", publicUrl);
      toast.success("Upload successful!", {
        id: tid,
      });
    } catch (err: any) {
      toast.error(err.message || "Upload failed", {
        id: tid,
      });
    }
  };

  const handleUpdateLesson = (
    index: number,
    field: string,
    value: string,
  ) => {
    setNewCourse((prev: any) => {
      const updatedLessons = [...(prev.lessons || [])];
      if (updatedLessons[index]) {
        updatedLessons[index] = {
          ...updatedLessons[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        lessons: updatedLessons,
      };
    });
  };

  const handleRemoveLesson = (index: number) => {
    const updatedLessons =
      newCourse.lessons.filter(
        (_: any, i: number) => i !== index,
      );
    setNewCourse({
      ...newCourse,
      lessons: updatedLessons,
    });
  };

  const handleAddQuestion = () => {
    setNewCourse((prev: any) => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: [
          ...(prev.quiz?.questions || []),
          {
            question_text: "",
            options: ["", "", "", ""],
            correct_answer_index: 0,
          },
        ],
      },
    }));
    setIsQuizModalOpen(true);
  };

  const handleUpdateQuestion = (
    index: number,
    field: string,
    value: any,
  ) => {
    setNewCourse((prev: any) => {
      const updatedQuestions = [...(prev.quiz?.questions || [])];
      if (updatedQuestions[index]) {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: updatedQuestions,
        },
      };
    });
  };

  const handleUpdateOption = (
    qIndex: number,
    oIndex: number,
    value: string,
  ) => {
    setNewCourse((prev: any) => {
      const updatedQuestions = [...(prev.quiz?.questions || [])];
      if (updatedQuestions[qIndex]) {
        const updatedOptions = [...updatedQuestions[qIndex].options];
        updatedOptions[oIndex] = value;
        updatedQuestions[qIndex] = {
          ...updatedQuestions[qIndex],
          options: updatedOptions,
        };
      }
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: updatedQuestions,
        },
      };
    });
  };

  const [courseStep, setCourseStep] = useState(1);

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

  const handleDeleteCourse = async (id: string) => {
    toast.error("Are you sure you want to delete this course?", {
      description: "This action is permanent and will remove all lessons, quizzes, and enrollments.",
      action: {
        label: "Delete",
        onClick: async () => {
          const tid = toast.loading("Deleting course...");
          try {
            // 1. Delete associated enrollments (training_management)
            const { error: enrollError } = await supabase
              .schema("bpm-anec-global")
              .from("training_management")
              .delete()
              .eq("course_id", id);
            
            if (enrollError) throw enrollError;

            // 2. Delete the course (cascades to lessons/quizzes)
            const { error } = await supabase
              .schema("bpm-anec-global")
              .from("learning_management")
              .delete()
              .eq("id", id);

            if (error) throw error;

            toast.success("Course deleted successfully!", { id: tid });
            fetchData();
          } catch (err: any) {
            toast.error(err.message || "Failed to delete course", { id: tid });
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(),
      },
      duration: 5000,
    });
  };

  const filteredCourses = courses.filter((c) => {
    // 1. If read-only, only show courses where employee is enrolled
    if (isReadOnlyRole) {
      const isEnrolled = enrollments.some(e => e.course_id === c.id && e.employee_id === profile?.id);
      if (!isEnrolled) return false;
    }

    const term = searchQuery.toLowerCase();
    const matchesSearch =
      (c.course_name || "")
        .toLowerCase()
        .includes(term) ||
      (c.category || "")
        .toLowerCase()
        .includes(term);
    const matchesCategory =
      categoryFilter === "all" ||
      c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
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
                Learning Management
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
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
            {canManageCourses && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSyncEnrollments}
                  className="border border-slate-200 text-slate-600 font-black rounded-xl h-11 px-6 hover:bg-slate-50 uppercase tracking-widest text-[10px] shadow-none"
                >
                  <Zap className="h-4 w-4 mr-2" />{" "}
                  Sync Employee's Lessons
                </Button>
                <Dialog
                  open={isAssignModalOpen}
                  onOpenChange={
                    setIsAssignModalOpen
                  }
                >
                  <DialogTrigger asChild>
                    <Button className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-black rounded-xl h-11 px-6">
                      <Users className="h-4 w-4 mr-2" />{" "}
                      Assign Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-xl">
                    <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
                      <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-emerald-600" />{" "}
                        Assign Employee Course
                      </DialogTitle>
                      <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                        Map an employee to an
                        existing course
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={
                        handleAssignCourse
                      }
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
                            <option
                              value=""
                              disabled
                            >
                              Choose a course...
                            </option>
                            {courses.map(
                              (course) => (
                                <option
                                  key={course.id}
                                  value={
                                    course.id
                                  }
                                >
                                  {
                                    course.course_name
                                  }{" "}
                                  (
                                  {
                                    course.category
                                  }
                                  )
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
                            <option
                              value=""
                              disabled
                            >
                              Select an
                              employee...
                            </option>
                            {employees.map(
                              (emp) => (
                                <option
                                  key={emp.id}
                                  value={emp.id}
                                >
                                  {emp.full_name ||
                                    "Unknown"}{" "}
                                  - {emp.role}
                                </option>
                              ),
                            )}
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
                  onOpenChange={(open) => {
                    setIsCourseModalOpen(open);
                    if (!open) setCourseStep(1);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-purple-500/20">
                      <Plus className="h-4 w-4 mr-2" />{" "}
                      Create Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none shadow-2xl rounded-[40px] bg-white">
                    <DialogHeader className="p-8 md:p-10 bg-gradient-to-br from-purple-900 via-slate-900 to-black text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter uppercase">
                            <BookOpen className="h-8 w-8 text-purple-400" />{" "}
                            Course Designer
                          </DialogTitle>
                          <DialogDescription className="font-bold text-purple-300/60 uppercase tracking-widest text-[10px] mt-2 ml-1">
                            Step {courseStep} of
                            3:{" "}
                            {courseStep === 1
                              ? "Core Configuration"
                              : courseStep === 2
                                ? "Learning Path & Lessons"
                                : "Validation & Growth"}
                          </DialogDescription>
                        </div>
                        <div className="flex gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-2 w-10 rounded-full transition-all duration-500 ${courseStep >= i ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-white/10"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8">
                      {courseStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                Course Title
                              </Label>
                              <Input
                                value={
                                  newCourse.course_name
                                }
                                onChange={(e) =>
                                  setNewCourse({
                                    ...newCourse,
                                    course_name:
                                      e.target
                                        .value,
                                  })
                                }
                                placeholder="e.g. Cybersecurity Fundamentals"
                                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                Category
                              </Label>
                              <select
                                value={
                                  newCourse.category
                                }
                                onChange={(e) =>
                                  setNewCourse({
                                    ...newCourse,
                                    category:
                                      e.target
                                        .value,
                                  })
                                }
                                className="flex h-12 w-full appearance-none items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option
                                  value=""
                                  disabled
                                >
                                  Select Category
                                </option>
                                {[
                                  "Technical",
                                  "Leadership",
                                  "Compliance",
                                  "Soft Skills",
                                  "Onboarding",
                                  "Sales & Marketing",
                                  "Customer Service",
                                  "Safety & Health",
                                  "Product Knowledge",
                                  "HR & Admin",
                                  "Other",
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
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                Estimated Duration
                              </Label>
                              <Input
                                value={
                                  newCourse.duration
                                }
                                onChange={(e) =>
                                  setNewCourse({
                                    ...newCourse,
                                    duration:
                                      e.target
                                        .value,
                                  })
                                }
                                placeholder="e.g. 5 Hours"
                                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                              Description
                            </Label>
                            <Input
                              value={
                                newCourse.description
                              }
                              onChange={(e) =>
                                setNewCourse({
                                  ...newCourse,
                                  description:
                                    e.target
                                      .value,
                                })
                              }
                              placeholder="A brief overview of what students will learn..."
                              className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-purple-500"
                            />
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              onClick={() =>
                                setCourseStep(2)
                              }
                              disabled={
                                !newCourse.course_name ||
                                !newCourse.category
                              }
                              className="rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white px-8 h-12"
                            >
                              Next: Lessons{" "}
                              <Plus className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {courseStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">
                              Course Lessons
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={
                                handleAddLesson
                              }
                              className="h-9 rounded-lg text-purple-600 font-bold hover:bg-purple-50"
                            >
                              <Plus className="h-4 w-4 mr-1" />{" "}
                              Add Lesson
                            </Button>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {(!newCourse.lessons ||
                              newCourse.lessons.length === 0) ? (
                              <div className="p-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                <PlayCircle className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  No lessons added
                                  yet
                                </p>
                              </div>
                            ) : (
                              newCourse.lessons?.map(
                                (
                                  lesson: any,
                                  index: number,
                                ) => (
                                  <div
                                    key={index}
                                    className="p-6 rounded-[24px] bg-white border border-slate-100 space-y-5 relative group hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300"
                                  >
                                    <button
                                      onClick={() =>
                                        handleRemoveLesson(
                                          index,
                                        )
                                      }
                                      className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="col-span-2 space-y-1">
                                        <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">
                                          Title
                                        </Label>
                                        <Input
                                          value={
                                            lesson.title
                                          }
                                          onChange={(
                                            e,
                                          ) =>
                                            handleUpdateLesson(
                                              index,
                                              "title",
                                              e
                                                .target
                                                .value,
                                            )
                                          }
                                          placeholder="Lesson Title"
                                          className="h-9 rounded-lg bg-white border-slate-100 text-xs font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">
                                          Type
                                        </Label>
                                        <select
                                          value={
                                            lesson.content_type
                                          }
                                          onChange={(
                                            e,
                                          ) =>
                                            handleUpdateLesson(
                                              index,
                                              "content_type",
                                              e
                                                .target
                                                .value,
                                            )
                                          }
                                          className="flex h-9 w-full appearance-none items-center justify-between rounded-lg bg-white px-2 py-1 text-xs font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                          <option value="text">
                                            Read
                                            Only
                                          </option>
                                          <option value="pdf">
                                            PDF
                                            File
                                          </option>
                                          <option value="youtube">
                                            YouTube
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">
                                        {lesson.content_type ===
                                        "youtube"
                                          ? "YouTube URL"
                                          : lesson.content_type ===
                                              "pdf"
                                            ? "PDF Document"
                                            : "Short Content/Instructions"}
                                      </Label>
                                      {lesson.content_type ===
                                      "pdf" ? (
                                        <div className="space-y-2">
                                          <div className="flex gap-2">
                                            <Input
                                              value={
                                                lesson.file_url ||
                                                ""
                                              }
                                              onChange={(
                                                e,
                                              ) =>
                                                handleUpdateLesson(
                                                  index,
                                                  "file_url",
                                                  e
                                                    .target
                                                    .value,
                                                )
                                              }
                                              placeholder="PDF URL or upload file..."
                                              className="h-9 rounded-lg bg-white border-slate-100 text-[10px] font-medium"
                                            />
                                            <div className="relative">
                                              <input
                                                type="file"
                                                accept=".pdf"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(
                                                  e,
                                                ) => {
                                                  const file =
                                                    e.target
                                                      .files?.[0];
                                                  if (
                                                    file
                                                  )
                                                    handleLessonFileUpload(
                                                      index,
                                                      file,
                                                    );
                                                }}
                                              />
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 rounded-lg border-purple-200 text-purple-600 font-bold text-[10px]"
                                              >
                                                Upload
                                              </Button>
                                            </div>
                                          </div>
                                          {lesson.file_url && (
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100">
                                              <FileText className="h-3 w-3 text-purple-600" />
                                              <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">
                                                {
                                                  lesson
                                                    .file_url
                                                    .split(
                                                      "/",
                                                    )
                                                    .pop()
                                                }
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <Input
                                          value={
                                            lesson.content_type ===
                                            "youtube"
                                              ? lesson.youtube_url
                                              : lesson.file_url
                                          }
                                          onChange={(
                                            e,
                                          ) => {
                                            const val =
                                              e.target
                                                .value;
                                            if (
                                              lesson.content_type ===
                                              "youtube"
                                            ) {
                                              // Simple YouTube URL normalization to embed format if needed
                                              handleUpdateLesson(
                                                index,
                                                "youtube_url",
                                                val,
                                              );
                                            } else {
                                              handleUpdateLesson(
                                                index,
                                                "file_url",
                                                val,
                                              );
                                            }
                                          }}
                                          placeholder={
                                            lesson.content_type ===
                                            "youtube"
                                              ? "https://youtube.com/watch?v=..."
                                              : "Link to resource..."
                                          }
                                          className="h-9 rounded-lg bg-white border-slate-100 text-xs font-medium"
                                        />
                                      )}
                                    </div>
                                  </div>
                                ),
                              )
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-4">
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setCourseStep(1)
                              }
                              className="font-bold text-slate-500"
                            >
                              Back
                            </Button>
                            <Button
                              onClick={() =>
                                setCourseStep(3)
                              }
                              className="rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white px-8 h-12"
                            >
                              Next: Quiz &
                              Automation{" "}
                              <Plus className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {courseStep === 3 && (
                        <form
                          onSubmit={
                            handleCreateCourse
                          }
                          className="space-y-6 animate-in fade-in slide-in-from-right-4"
                        >
                          <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="font-black text-xs uppercase tracking-widest text-slate-900">
                                  Course Quiz
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={
                                    newCourse.has_quiz
                                  }
                                  onChange={(e) =>
                                    setNewCourse({
                                      ...newCourse,
                                      has_quiz:
                                        e.target
                                          .checked,
                                    })
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                              </div>
                              {newCourse.has_quiz ? (
                                <div className="space-y-4 animate-in fade-in zoom-in-95">
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-slate-400">
                                      Passing
                                      Score (%)
                                    </Label>
                                    <Input
                                      type="number"
                                      value={
                                        newCourse
                                          .quiz
                                          .passing_score
                                      }
                                      onChange={(
                                        e,
                                      ) =>
                                        setNewCourse(
                                          {
                                            ...newCourse,
                                            quiz: {
                                              ...newCourse.quiz,
                                              passing_score:
                                                parseInt(
                                                  e
                                                    .target
                                                    .value,
                                                ),
                                            },
                                          },
                                        )
                                      }
                                      className="h-9 rounded-lg bg-white border-slate-100 text-xs font-bold"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={
                                      handleAddQuestion
                                    }
                                    className="w-full h-9 rounded-lg border-purple-200 text-purple-600 font-bold hover:bg-purple-50"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />{" "}
                                    Add Question (
                                    {
                                      newCourse
                                        .quiz
                                        ?.questions
                                        ?.length
                                    }
                                    )
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                                  Enable quiz to
                                  validate
                                  employee
                                  understanding
                                  after the
                                  course.
                                </p>
                              )}
                            </div>

                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4 text-slate-900">
                              <Label className="font-black text-xs uppercase tracking-widest text-slate-900">
                                Auto-Assignment
                              </Label>
                              <div className="space-y-1 text-slate-900">
                                <Label className="text-[8px] font-black uppercase text-slate-400">
                                  Target
                                  Department
                                </Label>
                                <select
                                  value={
                                    newCourse.auto_assign_dept_id
                                  }
                                  onChange={(e) =>
                                    setNewCourse({
                                      ...newCourse,
                                      auto_assign_dept_id:
                                        e.target
                                          .value,
                                    })
                                  }
                                  className="flex h-10 w-full appearance-none items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="none">
                                    Manual Only
                                  </option>
                                  {departments.map(
                                    (dept) => (
                                      <option
                                        key={
                                          dept.id
                                        }
                                        value={
                                          dept.id
                                        }
                                      >
                                        {
                                          dept.name
                                        }
                                      </option>
                                    ),
                                  )}
                                </select>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                                New and existing
                                employees in the
                                selected
                                department will be
                                automatically
                                enrolled.
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4">
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() =>
                                setCourseStep(2)
                              }
                              className="font-bold text-slate-500"
                            >
                              Back
                            </Button>
                            <Button
                              type="submit"
                              disabled={
                                submitting
                              }
                              className="rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white px-12 h-12 shadow-lg shadow-purple-500/20"
                            >
                              {submitting
                                ? "Publishing..."
                                : "Finish Blueprint"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-end gap-3">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-full md:w-[180px] h-10 bg-transparent border-slate-200 rounded-xl font-bold text-xs text-slate-600">
              <SelectValue placeholder="All Categories" />
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
                  courses.map((c) => c.category),
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
            <Input
              placeholder="Search courses..."
              className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-xl focus-visible:ring-purple-500 font-medium text-sm"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
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
            {!isDept1 && (
              <TabsTrigger
                value="enrollments"
                className="rounded-xl font-black h-full px-8 text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all"
              >
                Active Enrollments (
                {enrollments.length})
              </TabsTrigger>
            )}
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
                    className="border border-slate-100 shadow-sm rounded-xl hover:border-purple-200 transition-all bg-white group flex flex-col justify-between overflow-hidden"
                  >
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => launchViewer(course.id)}
                    >
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
                          {course.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 mt-auto space-y-4">
                      <div className="flex items-center justify-between py-4 border-y border-slate-50 gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />{" "}
                          {course.duration || "Self-Paced"}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            course.status === "Archived"
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}
                        >
                          {course.status || "Active"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black shrink-0">
                            {course.instructor?.charAt(0) || "NA"}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 truncate uppercase">
                            {course.instructor || "Self-Guided"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-purple-600 hover:bg-purple-50 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadCourseIntoState(course);
                              setCourseStep(1);
                              setIsCourseModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-purple-600 hover:bg-purple-50 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadCourseIntoState(course);
                              setCourseStep(2);
                              setIsCourseModalOpen(true);
                            }}
                          >
                            Lessons
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                className="h-8 w-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-300 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl border-slate-100 shadow-xl"
                            >
                              <DropdownMenuItem
                                className="font-black text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadCourseIntoState(course);
                                  setCourseStep(1);
                                  setIsCourseModalOpen(true);
                                }}
                              >
                                Edit Blueprint
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="font-black text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadCourseIntoState(course);
                                  setCourseStep(2);
                                  setIsCourseModalOpen(true);
                                }}
                              >
                                Manage Lessons
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="font-black text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer focus:bg-slate-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBlueprintStatus(
                                    course.id,
                                    course.status || "Active"
                                  );
                                }}
                              >
                                {course.status === "Archived" ? "Activate Course" : "Archive Course"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="font-black text-[10px] uppercase tracking-widest text-rose-600 cursor-pointer focus:text-rose-600 focus:bg-rose-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCourse(course.id);
                                }}
                              >
                                Delete Course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                    {isDept1
                      ? "Available courses will appear here once published by the HR admin."
                      : "Create a new course blueprint to get started."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {!isDept1 && (
            <TabsContent
              value="enrollments"
              className="focus:outline-none"
            >
              <Card className="border shadow-none rounded-2xl overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Employee
                      </TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Course
                      </TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Status
                      </TableHead>
                      <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Content / Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="px-8 py-16 text-center text-slate-400"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : enrollments.length > 0 ? (
                      enrollments.map((enr) => (
                        <TableRow
                          key={enr.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="px-8 py-5">
                            <span className="font-black text-slate-900 block">
                              {enr.profiles
                                ?.full_name ||
                                enr.employee_name ||
                                "Unknown"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {enr.profiles
                                ?.role ||
                                "Employee"}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-5 font-bold text-slate-700">
                            {enr.training_name}
                          </TableCell>
                          <TableCell className="px-8 py-5">
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
                                    e.target
                                      .value,
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
                          </TableCell>
                          <TableCell className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase">
                            <div className="flex items-center justify-end gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg border-purple-200 text-purple-600 font-black text-[10px] uppercase tracking-widest hover:bg-purple-50"
                                onClick={() => {
                                  launchViewer(
                                    enr.course_id,
                                  );
                                }}
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />{" "}
                                View Course
                              </Button>
                              {enr.status ===
                              "Completed" ? (
                                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400">
                                  {enr.completion_date ||
                                    "Not Finished"}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-16 text-center text-sm font-black text-slate-400 tracking-widest uppercase"
                        >
                          No active enrollments
                          recorded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      {/* Quiz Question Editor Modal (Nested or separate) */}
      <Dialog
        open={isQuizModalOpen}
        onOpenChange={setIsQuizModalOpen}
      >
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-none shadow-2xl rounded-[40px] bg-white h-[85vh] flex flex-col">
          <DialogHeader className="p-8 md:p-10 bg-gradient-to-br from-purple-900 via-slate-900 to-black text-white relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent)] pointer-events-none" />
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <CheckCircle2 className="h-6 w-6 text-purple-400" />
              </div>
              Quiz Architecture
            </DialogTitle>
            <DialogDescription className="text-purple-300 font-bold uppercase tracking-widest text-[10px] mt-2 ml-16 opacity-70">
              Precision Configuration for Employee Growth
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 md:p-12 space-y-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
            {newCourse.quiz?.questions?.map(
              (q: any, qIndex: number) => (
                <div
                  key={qIndex}
                  className="p-8 rounded-[32px] bg-white border border-slate-100 space-y-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Question {qIndex + 1}
                    </Label>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-300 hover:text-rose-500"
                      onClick={() => {
                        const updated =
                          newCourse.quiz?.questions?.filter(
                            (_: any, i: number) =>
                              i !== qIndex,
                          );
                        setNewCourse({
                          ...newCourse,
                          quiz: {
                            ...newCourse.quiz,
                            questions: updated,
                          },
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={q.question_text}
                    onChange={(e) =>
                      handleUpdateQuestion(
                        qIndex,
                        "question_text",
                        e.target.value,
                      )
                    }
                    placeholder="Type your question here..."
                    className="h-11 rounded-xl bg-white border-slate-100 font-bold"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {q.options?.map(
                      (
                        opt: string,
                        oIndex: number,
                      ) => (
                        <div
                          key={oIndex}
                          className="flex gap-2"
                        >
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={
                              q.correct_answer_index ===
                              oIndex
                            }
                            onChange={() =>
                              handleUpdateQuestion(
                                qIndex,
                                "correct_answer_index",
                                oIndex,
                              )
                            }
                            className="mt-3"
                          />
                          <Input
                            value={opt}
                            onChange={(e) =>
                              handleUpdateOption(
                                qIndex,
                                oIndex,
                                e.target.value,
                              )
                            }
                            placeholder={`Option ${oIndex + 1}`}
                            className="h-10 rounded-xl bg-white border-slate-100 text-xs font-medium"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleAddQuestion}
                className="rounded-xl border-purple-200 text-purple-600 font-black uppercase tracking-widest text-[10px] px-8"
              >
                <Plus className="h-4 w-4 mr-2" />{" "}
                Add Another Question
              </Button>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button
              className="bg-slate-900 text-white font-black rounded-xl px-8 h-12"
              onClick={() => setIsQuizModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>

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
