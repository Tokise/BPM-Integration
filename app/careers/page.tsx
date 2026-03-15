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

import { getOpenJobPostings } from "@/app/actions/hr";

type JobPosting = {
  id: string;
  job_title: string;
  budget?: number;
  status: string;
  job_description?: string;
  required_experience?: string;
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
    contactNumber: "",
    civilStatus: "",
    address: "",
    age: "",
    birthDate: "",
    parentsName: "",
    drivingLicenseType: "None",
  });
  const [resumeFile, setResumeFile] =
    useState<File | null>(null);
  const [idFile, setIdFile] =
    useState<File | null>(null);
  const [uploadProgress, setUploadProgress] =
    useState(0);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const res = await getOpenJobPostings();
    if (res.success && res.data) {
      setJobs(res.data as any);
    } else {
      console.error("Failed to fetch jobs:", res.error);
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
      contactNumber: "",
      civilStatus: "",
      address: "",
      age: "",
      birthDate: "",
      parentsName: "",
      drivingLicenseType: "None",
    });
    setResumeFile(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!selectedJob || !resumeFile || !idFile) {
      toast.error(
        "Please upload both resume and ID/Passport",
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(5);

    try {
      // 0. Email Duplication Check
      const {
        data: existing,
        error: checkError,
      } = await supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        toast.error(
          "An application with this email already exists.",
        );
        setIsSubmitting(false);
        return;
      }

      setUploadProgress(15);

      // 1. Upload Resume
      const resumeExt = resumeFile.name
        .split(".")
        .pop();
      const resumeName = `${Date.now()}-resume-${Math.random().toString(36).substring(2)}.${resumeExt}`;
      const { error: resumeError } =
        await supabase.storage
          .from("resumes")
          .upload(resumeName, resumeFile);

      if (resumeError) throw resumeError;
      setUploadProgress(40);

      // 2. Upload ID
      const idExt = idFile.name.split(".").pop();
      const idName = `${Date.now()}-id-${Math.random().toString(36).substring(2)}.${idExt}`;
      const { error: idError } =
        await supabase.storage
          .from("resumes")
          .upload(idName, idFile);

      if (idError) throw idError;
      setUploadProgress(65);

      // 3. Get Public URLs
      const {
        data: { publicUrl: resumeUrl },
      } = supabase.storage
        .from("resumes")
        .getPublicUrl(resumeName);

      const {
        data: { publicUrl: idUrl },
      } = supabase.storage
        .from("resumes")
        .getPublicUrl(idName);

      setUploadProgress(85);

      // 4. Submit to applicant_management
      const payload: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        contact_number: formData.contactNumber,
        civil_status: formData.civilStatus,
        address: formData.address,
        age: formData.age
          ? parseInt(formData.age, 10)
          : null,
        birth_date: formData.birthDate || null,
        parents_name: formData.parentsName,
        driving_license_type:
          formData.drivingLicenseType,
        resume_url: resumeUrl,
        id_url: idUrl,
        status: "applied",
        position: selectedJob.job_title,
      };

      const { error: insertError } =
        await supabase
          .schema("bpm-anec-global")
          .from("applicant_management")
          .insert(payload);

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
          "Failed to process your application.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="pt-24 pb-12 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-4 mb-16">
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter">
            Join the{" "}
            <span className="text-amber-500">
              Future
            </span>{" "}
            of Global Commerce
          </h1>
          <p className="text-xl text-slate-500 font-bold uppercase tracking-widest">
            Careers at ANEC Global
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 mt-6">
              Synchronizing Roles
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[40px] border border-slate-100">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
              Resting Phase
            </h3>
            <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
              We're currently scaling our
              infrastructure. Check back soon for
              new opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="group relative flex flex-col lg:flex-row lg:items-center justify-between p-0 hover:translate-x-2 transition-all duration-500"
              >
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3" />{" "}
                      Full-time / Remote
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-amber-600 text-[10px] font-black uppercase tracking-widest">
                      {job.budget
                        ? `₱${job.budget.toLocaleString()}`
                        : "Top Tier"}
                    </span>
                  </div>

                  <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-6">
                    {job.job_title}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">
                      Requirement
                    </p>
                    <p className="text-slate-600 font-bold leading-relaxed max-w-xl">
                      {job.required_experience ||
                        "3+ years of relevant experience in the industry."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">
                      Description
                    </p>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                      {job.job_description ||
                        "We are looking for a dedicated individual to join our growing global team."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 lg:mt-0">
                  <Button
                    onClick={() =>
                      handleApplyClick(job)
                    }
                    className="bg-slate-900 hover:bg-amber-500 text-white rounded-[24px] px-12 h-16 lg:h-20 font-black shadow-2xl shadow-slate-200 hover:shadow-amber-200 transition-all duration-500 group/btn"
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
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactNumber"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Contact Number
                    </Label>
                    <Input
                      id="contactNumber"
                      required
                      value={
                        formData.contactNumber
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber:
                            e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="birthDate"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Birth Date
                    </Label>
                    <DialogTitle asChild>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthDate:
                              e.target.value,
                          })
                        }
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500 [color-scheme:light]"
                      />
                    </DialogTitle>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="100"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="25"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="civilStatus"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Civil Status
                    </Label>
                    <Input
                      id="civilStatus"
                      value={formData.civilStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          civilStatus:
                            e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="Single, Married, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="parentsName"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Parents' Names / Guardian
                    </Label>
                    <Input
                      id="parentsName"
                      value={formData.parentsName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentsName:
                            e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="Name of parent or guardian"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label
                      htmlFor="address"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Complete Address
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: e.target.value,
                        })
                      }
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
                      placeholder="123 Main St, City, Province, ZIP"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="drivingLicenseType"
                    className="text-xs font-black uppercase tracking-[0.15em] text-slate-400"
                  >
                    Driving License Requirements
                  </Label>
                  <select
                    id="drivingLicenseType"
                    value={
                      formData.drivingLicenseType
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drivingLicenseType:
                          e.target.value,
                      })
                    }
                    className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none transition-all"
                  >
                    <option value="None">
                      None
                    </option>
                    <option value="Non-Professional">
                      Non-Professional
                    </option>
                    <option value="Professional (L_VEH)">
                      Professional (Light Vehicle)
                    </option>
                    <option value="Professional (H_VEH)">
                      Professional (Heavy Vehicle)
                    </option>
                  </select>
                </div>

                <div className="space-y-6">
                  <Label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                    Required Documents
                  </Label>

                  {/* Resume Upload */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">
                      CV / Resume (PDF/DOCX)
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
                        className="relative overflow-hidden bg-slate-50/50 rounded-[20px] p-8 text-center cursor-pointer border border-dashed border-slate-200 hover:bg-white hover:border-amber-200 transition-all group"
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
                        <Upload className="h-6 w-6 text-slate-300 mx-auto mb-2 group-hover:text-amber-500" />
                        <p className="text-xs font-black text-slate-900">
                          Click to upload Resume
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-slate-900 rounded-[20px] border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-amber-500" />
                          <p className="text-xs font-black text-white truncate max-w-[200px]">
                            {resumeFile.name}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setResumeFile(null)
                          }
                          className="h-8 w-8 text-white/30 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ID/Passport Upload */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">
                      Valid ID / Passport
                      (PDF/Image)
                    </Label>
                    {!idFile ? (
                      <div
                        onClick={() =>
                          document
                            .getElementById(
                              "id-upload",
                            )
                            ?.click()
                        }
                        className="relative overflow-hidden bg-slate-50/50 rounded-[20px] p-8 text-center cursor-pointer border border-dashed border-slate-200 hover:bg-white hover:border-amber-200 transition-all group"
                      >
                        <input
                          id="id-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0];
                            if (file)
                              setIdFile(file);
                          }}
                        />
                        <Upload className="h-6 w-6 text-slate-300 mx-auto mb-2 group-hover:text-amber-500" />
                        <p className="text-xs font-black text-slate-900">
                          Click to upload ID
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-slate-900 rounded-[20px] border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <p className="text-xs font-black text-white truncate max-w-[200px]">
                            {idFile.name}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setIdFile(null)
                          }
                          className="h-8 w-8 text-white/30 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

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
