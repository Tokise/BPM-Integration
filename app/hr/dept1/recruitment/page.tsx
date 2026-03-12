"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ArrowLeft,
  Plus,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

type JobPosting = {
  id: string;
  job_title: string;
  department_id: string;
  budget: number | null;
  status: string;
  required_experience: string | null;
  job_description: string | null;
  created_at?: string;
  departments?: { name: string };
};

export default function JobPostingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobPosting[]>(
    [],
  );
  const [departments, setDepartments] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formData, setFormData] = useState({
    job_title: "",
    budget: "",
    required_experience: "",
    job_description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [jobsRes, deptRes] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("recruitment_management")
        .select(
          `
          id,
          job_title,
          department_id,
          budget,
          status,
          departments ( name )
        `,
        )
        .order("id", {
          ascending: false,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("departments")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (jobsRes.data)
      setJobs(jobsRes.data as any);
    if (deptRes.data) {
      // Filter out IT department for now as requested
      const filteredDepts = deptRes.data.filter(
        (d) =>
          !d.name?.toUpperCase().includes("IT"),
      );
      setDepartments(filteredDepts);
    }
    setLoading(false);
  };

  const filteredJobs = jobs.filter((job) => {
    const jobTitle = (
      job.job_title || ""
    ).toLowerCase();
    const deptName = (
      job.departments?.name || ""
    ).toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      jobTitle.includes(q) ||
      deptName.includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateJob = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !formData.job_title ||
      !formData.job_description
    ) {
      toast.error(
        "Please fill in all required fields.",
      );
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      "Creating job posting...",
    );

    try {
      const budgetValue = formData.budget
        ? parseInt(formData.budget)
        : null;

      const { data, error } = await supabase
        .schema("bpm-anec-global")
        .from("recruitment_management")
        .insert({
          job_title: formData.job_title,
          budget: budgetValue,
          required_experience:
            formData.required_experience,
          job_description:
            formData.job_description,
          status: "open",
        })
        .select();

      if (error) throw error;

      toast.success(
        "Job posting created successfully!",
        { id: toastId },
      );
      setIsModalOpen(false);
      setFormData({
        job_title: "",
        budget: "",
        required_experience: "",
        job_description: "",
      });
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to create job posting",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (
    id: string,
    currentStatus: string,
  ) => {
    const newStatus =
      currentStatus === "open"
        ? "closed"
        : "open";
    const toastId = toast.loading(
      `Marking as ${newStatus}...`,
    );

    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("recruitment_management")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        `Job marked as ${newStatus}`,
        { id: toastId },
      );
      fetchData();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to update status",
        { id: toastId },
      );
    }
  };

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
              Job Postings
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Job Postings
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Manage external recruitment listings
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 shadow-lg shadow-amber-200"
        >
          <Plus className="h-5 w-5 mr-2" /> Create
          Job Posting
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-end gap-3">
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px] h-10 bg-transparent border-slate-200 rounded-lg font-bold text-xs text-slate-600">
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
              value="open"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Open
            </SelectItem>
            <SelectItem
              value="closed"
              className="font-bold text-xs uppercase tracking-widest p-3"
            >
              Closed
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative group w-full md:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <Input
            placeholder="Search postings..."
            className="pl-9 h-10 bg-transparent border-slate-200 shadow-none rounded-lg focus-visible:ring-amber-500 font-medium text-sm"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card className="border-none shadow-sm rounded-[32px] p-20 text-center animate-pulse font-black text-slate-300 bg-white/50">
            Loading Job Postings...
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="border-none shadow-sm rounded-[32px] p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest bg-white/50">
            No job postings found
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card
              key={job.id}
              className={`border shadow-sm rounded-xl overflow-hidden transition-all ${
                job.status === "closed"
                  ? "bg-slate-50/50 opacity-75"
                  : "bg-white hover:ring-2 hover:ring-slate-100"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <div
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        job.status === "open"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <Briefcase className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-slate-900">
                          {job.job_title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                            job.status === "open"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 mt-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {job.departments
                            ?.name ||
                            "Multiple Departments"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold">
                            ₱
                          </span>
                          {job.budget
                            ? `${job.budget.toLocaleString()}`
                            : "Competitive"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Posted{" "}
                          {job.created_at
                            ? new Date(
                                job.created_at,
                              ).toLocaleDateString()
                            : "Recently"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <Button
                      variant={
                        job.status === "open"
                          ? "outline"
                          : "default"
                      }
                      onClick={() =>
                        handleToggleStatus(
                          job.id,
                          job.status,
                        )
                      }
                      className={`h-10 rounded-xl font-bold ${
                        job.status === "open"
                          ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {job.status === "open"
                        ? "Close Posting"
                        : "Reopen Posting"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                      >
                        <Button
                          variant="ghost"
                          className="h-10 w-10 p-0 rounded-xl"
                        >
                          <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-xl font-medium shadow-xl"
                      >
                        <DropdownMenuItem className="cursor-pointer">
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Job Dialog */}
      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <DialogContent className="sm:max-w-[500px] border-none rounded-[32px] overflow-hidden p-0 bg-slate-50">
          <div className="p-8 pb-6 bg-white border-b border-slate-100">
            <DialogTitle className="text-2xl font-black text-slate-900">
              Create Job Posting
            </DialogTitle>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
              Add a new role to the public careers
              page
            </p>
          </div>

          <form
            onSubmit={handleCreateJob}
            className="p-8 space-y-6"
          >
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Job Title{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>
              <Input
                required
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    job_title: e.target.value,
                  })
                }
                placeholder="e.g. Senior Frontend Engineer"
                className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold placeholder:font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Job Description{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>
              <textarea
                required
                value={formData.job_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    job_description:
                      e.target.value,
                  })
                }
                placeholder="Describe the role and responsibilities..."
                className="w-full min-h-[100px] p-4 rounded-2xl bg-white border-none shadow-sm font-bold placeholder:font-medium resize-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Required Experience
              </Label>
              <Input
                value={
                  formData.required_experience
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    required_experience:
                      e.target.value,
                  })
                }
                placeholder="e.g. 3+ years in React development"
                className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold placeholder:font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Budget (Optional)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₱
                </span>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: e.target.value,
                    })
                  }
                  placeholder="e.g. 120000"
                  className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm font-bold"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="h-12 rounded-xl font-bold px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl px-8 shadow-lg shadow-amber-200"
              >
                {isSubmitting
                  ? "Publishing..."
                  : "Publish Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
