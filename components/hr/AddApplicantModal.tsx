"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddApplicantModal({
  onExited,
}: {
  onExited?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(
      e.currentTarget,
    );
    const firstName = formData.get(
      "firstName",
    ) as string;
    const lastName = formData.get(
      "lastName",
    ) as string;
    const email = formData.get("email") as string;
    const resumeUrl = formData.get(
      "resumeUrl",
    ) as string;

    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          resume_url: resumeUrl,
          status: "applied",
        });

      if (error) throw error;

      toast.success(
        "Applicant added successfully!",
      );
      setOpen(false);
      if (onExited) onExited();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to add applicant",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20">
          <UserPlus className="h-4 w-4 mr-2" />{" "}
          New Applicant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tighter">
            Add Applicant
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Enter the details for the new
            candidate.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 pt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                required
                className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                required
                className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus-visible:ring-blue-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
            >
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              required
              className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus-visible:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="resumeUrl"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
            >
              Resume / LinkedIn URL
            </Label>
            <Input
              id="resumeUrl"
              name="resumeUrl"
              placeholder="https://..."
              className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus-visible:ring-blue-500"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl h-14 shadow-xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Applicant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
