"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type JobPosting = {
  id: string;
  job_title: string;
  department_id: string;
  budget: number;
  status: string;
  departments?: { name: string };
};

export default function CareersPage() {
  const supabase = createClient();

  const [jobs, setJobs] = useState<JobPosting[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Application Modal State
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [selectedJob, setSelectedJob] =
    useState<JobPosting | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [formSuccess, setFormSuccess] =
    useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [resumeFile, setResumeFile] =
    useState<File | null>(null);
  const [uploadProgress, setUploadProgress] =
    useState(0);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
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
      .eq("status", "open"); // Only fetch open roles

    if (!error && data) {
      setJobs(data as any);
    }
    setLoading(false);
  };

  const handleApplyClick = (job: JobPosting) => {
    setSelectedJob(job);
    setFormSuccess(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
    });
    setResumeFile(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!selectedJob || !resumeFile) {
      toast.error("Please upload your resume");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10); // Start progress

    try {
      // 1. Upload to Supabase Storage
      const fileExt = resumeFile.name
        .split(".")
        .pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploadProgress(30);

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      setUploadProgress(90);

      // 3. Submit data to applicant_management
      const { error: insertError } =
        await supabase
          .schema("bpm-anec-global")
          .from("applicant_management")
          .insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            resume_url: publicUrl,
            status: "applied",
          });

      if (insertError) throw insertError;

      setUploadProgress(100);
      setFormSuccess(true);
      toast.success(
        "Application submitted successfully!",
      );

      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Submission Failed", {
        description:
          error.message ||
          "Failed to upload resume or submit data.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-slate-950 pt-32 pb-48 lg:pt-48 lg:pb-72 shrink-0">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center lg:text-left">
          <div className="max-w-4xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">
                We're growing at ANEC Global
              </span>
            </div>

            <h1 className="text-6xl lg:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Shape the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 drop-shadow-2xl">
                Global Commerce
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-400 font-medium mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              Join a high-performance team
              building the next generation of
              global supply chain and marketplace
              infrastructure.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-12 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              <div className="space-y-1">
                <p className="text-3xl font-black text-white tracking-tighter">
                  100%
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                  Remote Friendly
                </p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <p className="text-3xl font-black text-white tracking-tighter">
                  15+
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                  Open Positions
                </p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <p className="text-3xl font-black text-white tracking-tighter">
                  Gold
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                  Standard Benefits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Modern Job Board Layout */}
      <main className="flex-1 w-full relative z-20 -mt-32 pb-32">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                label: "Available Roles",
                value: jobs.length,
                icon: Briefcase,
              },
              {
                label: "Work Locations",
                value: "Global",
                icon: MapPin,
              },
              {
                label: "Our Mission",
                value: "Impact",
                icon: Send,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-2xl rounded-[28px] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-between group hover:border-amber-200 transition-all duration-500"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    {stat.value}
                  </p>
                </div>
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-50 group-hover:scale-110 transition-all">
                  <stat.icon className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[48px] p-4 lg:p-6 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="p-8 lg:p-12 border-b border-slate-50">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
                Explore Life at ANEC
              </h2>
              <p className="text-slate-500 font-medium text-lg lg:text-xl max-w-2xl">
                We're looking for architects,
                builders, and dreamers to redefine
                how the world moves goods and
                manages talent.
              </p>
            </div>

            {loading ? (
              <div className="py-48 flex flex-col items-center justify-center">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                  <div className="absolute inset-0 blur-xl bg-amber-500/20 animate-pulse" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 mt-6 lg:mt-8">
                  Syncing Roles
                </p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-32 text-center">
                <div className="h-24 w-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                  <Briefcase className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                  Positioning for the Future
                </h3>
                <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                  Currently, our team is at
                  capacity. Leave your info and
                  we'll reach out when we expand.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest border-2"
                >
                  Drop your CV
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="group relative flex flex-col lg:flex-row lg:items-center justify-between p-10 lg:p-14 hover:bg-slate-50/50 transition-all duration-500"
                  >
                    <div className="relative z-10 max-w-2xl mb-8 lg:mb-0">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                          {job.departments
                            ?.name || "General"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />{" "}
                          Full-time
                        </span>
                      </div>

                      <h3 className="text-3xl lg:text-4xl font-black text-slate-900 group-hover:translate-x-2 transition-transform duration-500 tracking-tighter">
                        {job.job_title}
                      </h3>

                      <p className="text-slate-400 font-medium mt-4 flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                        <MapPin className="w-4 h-4" />{" "}
                        Global / Remote Friendly
                      </p>
                    </div>

                    <div className="flex items-center gap-8 lg:gap-12 relative z-10">
                      <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Budget Range
                        </p>
                        <p className="text-xl lg:text-2xl font-black text-slate-900 tabular-nums">
                          {job.budget
                            ? `₱${job.budget.toLocaleString()}`
                            : "Top Tier"}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          handleApplyClick(job)
                        }
                        className="bg-slate-950 hover:bg-amber-500 text-white rounded-[24px] px-10 h-16 lg:h-20 font-black shadow-2xl shadow-slate-950/10 hover:shadow-amber-500/30 transition-all duration-500 group/btn"
                      >
                        <span className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-black">
                          Apply Now
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                        </span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Application Dialog */}
      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          {formSuccess ? (
            <div className="p-16 text-center flex flex-col items-center justify-center bg-white">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 border border-emerald-100/50">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">
                Application Received
              </h3>
              <p className="text-slate-500 font-medium max-w-sm">
                Thanks for applying to the{" "}
                <span className="text-amber-600 font-bold">
                  {selectedJob?.job_title}
                </span>{" "}
                role. Our team will reach out
                soon!
              </p>
            </div>
          ) : (
            <div className="bg-white flex flex-col">
              <div className="p-10 pb-8 border-b border-slate-50 bg-slate-50/30">
                <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">
                  Join Our Team
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                  Applying for{" "}
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                    {selectedJob?.job_title}
                  </span>
                </DialogDescription>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-10 space-y-8 max-h-[70vh] overflow-y-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstName:
                            e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lastName:
                            e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                    Resume Documents
                  </Label>

                  {!resumeFile ? (
                    <div
                      onClick={() =>
                        document
                          .getElementById(
                            "resume-upload",
                          )
                          ?.click()
                      }
                      className="relative overflow-hidden bg-slate-50/50 rounded-[24px] p-12 text-center cursor-pointer border border-slate-100 hover:bg-white hover:border-amber-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-amber-500/5"
                    >
                      <input
                        id="resume-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];
                          if (file)
                            setResumeFile(file);
                        }}
                      />
                      <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Upload className="h-7 w-7 text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <p className="text-lg font-black text-slate-900 tracking-tight">
                        Attach your resume
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 bg-slate-100/50 px-3 py-1 rounded-full inline-block">
                        PDF or DOCX • Max 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[24px] border border-slate-800 shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                          <FileText className="h-7 w-7 text-amber-500" />
                        </div>
                        <div className="max-w-[240px]">
                          <p className="text-sm font-black text-white truncate">
                            {resumeFile.name}
                          </p>
                          <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                            {(
                              resumeFile.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB • Ready to send
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setResumeFile(null)
                        }
                        className="h-10 w-10 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {isSubmitting && (
                    <div className="space-y-3 pt-2">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          style={{
                            width: `${uploadProgress}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em] text-center animate-pulse">
                        {uploadProgress < 100
                          ? `Syncing Data: ${uploadProgress}%`
                          : "Transfer Complete"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-8 flex gap-4 sticky bottom-0 bg-white/80 backdrop-blur-sm -mx-2 px-2 pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setIsModalOpen(false)
                    }
                    className="flex-1 rounded-2xl h-16 font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px]"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2.5] bg-slate-900 hover:bg-amber-500 text-white rounded-2xl h-16 font-black shadow-2xl shadow-slate-900/20 hover:shadow-amber-500/30 transition-all uppercase tracking-[0.2em] text-[10px] group"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Finalize Application
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
