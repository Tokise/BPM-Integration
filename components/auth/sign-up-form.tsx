"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  X,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

interface SignUpFormProps {
  signUpAction: (
    formData: FormData,
  ) => Promise<any>;
  searchParamsNext: string;
}

export function SignUpForm({
  signUpAction,
  searchParamsNext,
}: SignUpFormProps) {
  const {} = useUser();
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] =
    useState({
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
    });

  useEffect(() => {
    const reqs = {
      length: password.length === 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    setRequirements(reqs);

    const count =
      Object.values(reqs).filter(Boolean).length;
    setStrength((count / 5) * 100);
  }, [password]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/;
    if (!passwordRegex.test(password)) {
      e.preventDefault();
      return;
    }

    // Form action will be handled by the action prop
  };

  const requirementLabels = [
    {
      key: "length",
      label: "Exactly 8 characters",
    },
    {
      key: "upper",
      label: "One uppercase letter",
    },
    {
      key: "lower",
      label: "One lowercase letter",
    },
    { key: "number", label: "One number" },
    {
      key: "special",
      label: "One special character",
    },
  ];

  return (
    <form
      onSubmit={(e) => {
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/;
        if (!passwordRegex.test(password)) {
          e.preventDefault();
          toast.error(
            "Password does not meet requirements",
          );
          return;
        }
      }}
      action={async (formData) => {
        const toastId = toast.loading(
          "Creating your account...",
        );
        try {
          await signUpAction(formData);
          toast.success(
            "Account created successfully",
            { id: toastId },
          );
        } catch (error) {
          toast.error(
            "Failed to create account",
            { id: toastId },
          );
        }
      }}
      className="grid gap-4"
    >
      <div className="grid gap-2">
        <Label
          htmlFor="fullName"
          className="text-slate-700 font-bold"
        >
          Full Name
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Juan Dela Cruz"
          required
          className="h-12 bg-slate-50 border-slate-100 focus:bg-white rounded-xl transition-all font-medium"
        />
      </div>
      <div className="grid gap-2">
        <Label
          htmlFor="email"
          className="text-slate-700 font-bold"
        >
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="m@example.com"
          required
          className="h-12 bg-slate-50 border-slate-100 focus:bg-white rounded-xl transition-all font-medium"
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password font-bold">
            Password
          </Label>
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              strength === 100
                ? "text-emerald-500"
                : strength > 60
                  ? "text-amber-500"
                  : "text-slate-400",
            )}
          >
            {strength === 100
              ? "Strong"
              : strength > 60
                ? "Medium"
                : "Weak"}
          </span>
        </div>
        <div className="relative group">
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            maxLength={8}
            className="h-12 bg-slate-50 border-slate-100 focus:bg-white rounded-xl transition-all pr-10 font-medium"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {strength === 100 ? (
              <Shield className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
            ) : (
              <Lock className="h-4 w-4 text-slate-300" />
            )}
          </div>
        </div>

        {/* Password Strength Progress Bar */}
        <div className="space-y-2 mt-1 px-1">
          <Progress
            value={strength}
            className="h-1.5 bg-slate-100"
            indicatorClassName={cn(
              "transition-all duration-500",
              strength === 100
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : strength > 60
                  ? "bg-amber-500"
                  : strength > 20
                    ? "bg-orange-500"
                    : "bg-red-500",
            )}
          />

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
            {requirementLabels.map((req, i) => {
              const isMet = (requirements as any)[
                req.key
              ];
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 transition-all duration-300"
                >
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full flex items-center justify-center border transition-all",
                      isMet
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    {isMet ? (
                      <Check className="h-2 w-2 stroke-[4px]" />
                    ) : (
                      <div className="h-1 w-1 bg-slate-300 rounded-full" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest transition-colors",
                      isMet
                        ? "text-emerald-600"
                        : "text-slate-400",
                    )}
                  >
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-primary text-black hover:bg-primary/90 font-black text-lg rounded-xl shadow-lg shadow-primary/20 transition-all border-none mt-2"
      >
        Create Account
      </Button>
    </form>
  );
}
