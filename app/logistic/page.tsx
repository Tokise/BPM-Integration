"use client";

import { useEffect } from "react";
import { Map, AlertCircle } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LogisticDashboard() {
  const { profile, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      if (
        profile.department?.code ===
        "LOGISTIC_DEPT1"
      ) {
        router.replace("/logistic/dept1");
      } else if (
        profile.department?.code ===
        "LOGISTIC_DEPT2"
      ) {
        router.replace("/logistic/dept2");
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const isLogisticsRole =
    profile?.role?.includes("logistic") ||
    profile?.role?.includes("warehouse") ||
    profile?.role?.includes("driver") ||
    profile?.role?.includes("fleet") ||
    profile?.role === "admin";

  if (!isLogisticsRole) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center px-4">
        <div className="h-20 w-20 rounded-[32px] bg-red-50 flex items-center justify-center mb-6 shadow-sm border border-red-100">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Access Denied
        </h2>
        <p className="text-slate-500 mt-3 max-w-md font-medium">
          Your account is not authorized to access
          the Logistics Workspace. Please contact
          your administrator if you believe this
          is an error.
        </p>
        <Button
          asChild
          className="mt-10 rounded-[20px] bg-slate-900 hover:bg-slate-800 h-12 px-8 shadow-lg shadow-slate-200"
        >
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-6 text-slate-400 p-8 text-center max-w-sm font-semibold">
        <div className="h-24 w-24 rounded-[32px] bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-xl shadow-indigo-100/50">
          <Map className="h-10 w-10 text-indigo-400 animate-pulse" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Logistics Workspace
          </h2>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 leading-relaxed">
            Please select a specific department
            from the sidebar to begin managing
            operations.
          </p>
        </div>
      </div>
    </div>
  );
}
