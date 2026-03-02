"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreVertical,
  PlayCircle,
  Clock,
  Users,
  CheckCircle2,
  ChevronLeft,
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

export default function LearningManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newCourse, setNewCourse] = useState({
    course_name: "",
    description: "",
    category: "Technical",
    duration: "2 hours",
    instructor: "",
  });

  useEffect(() => {
    fetchCourses();

    const channel = supabase
      .channel("learning_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "learning_management",
        },
        fetchCourses,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("learning_management")
      .select("*")
      .order("created_at", { ascending: false });

    setCourses(data || []);
    setLoading(false);
  };

  const handleAddCourse = async () => {
    if (!newCourse.course_name)
      return toast.error(
        "Course name is required",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("learning_management")
      .insert([newCourse]);

    if (error) {
      toast.error("Failed to add course");
    } else {
      toast.success("Course added successfully");
      setIsModalOpen(false);
      setNewCourse({
        course_name: "",
        description: "",
        category: "Technical",
        duration: "2 hours",
        instructor: "",
      });
      fetchCourses();
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.course_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      c.category
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
                router.push("/hr/dept2")
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
              Learning Catalog
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Course management & E-Learning
              Assets
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-purple-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  New Course
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="name"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Course Name
                  </Label>
                  <Input
                    id="name"
                    value={newCourse.course_name}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        course_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Advanced React Architecture"
                    className="rounded-xl border-slate-100 focus:ring-purple-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="category"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={newCourse.category}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        category: e.target.value,
                      })
                    }
                    placeholder="e.g. Technical"
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="instructor"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Instructor
                  </Label>
                  <Input
                    id="instructor"
                    value={newCourse.instructor}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        instructor:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Dr. Jane Smith"
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="desc"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Description
                  </Label>
                  <textarea
                    id="desc"
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description:
                          e.target.value,
                      })
                    }
                    className="flex min-h-[80px] w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe the course objectives..."
                  />
                </div>
              </div>
              <Button
                onClick={handleAddCourse}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-11"
              >
                Save Course
              </Button>
            </DialogContent>
          </Dialog>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-white rounded-[32px] animate-pulse shadow-sm"
                />
              ))
            : filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all bg-white"
                >
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-[10px] font-black uppercase text-purple-500 tracking-widest">
                        {course.category}
                      </p>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                        {course.course_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {course.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          12 Students
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white" />
                        <span className="text-xs font-bold text-slate-600">
                          {course.instructor}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-purple-600 font-black text-[10px] uppercase tracking-widest hover:bg-purple-50 p-0 h-auto"
                      >
                        View Details{" "}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}
