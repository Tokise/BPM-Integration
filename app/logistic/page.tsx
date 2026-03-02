"use client";

import { useUser } from "@/context/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogisticDashboardRedirect() {
  const { profile } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (
      profile?.department?.code === "LOG_DEPT1"
    ) {
      router.push("/logistic/dept1");
    } else if (
      profile?.department?.code === "LOG_DEPT2"
    ) {
      router.push("/logistic/dept2");
    }
  }, [profile, router]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black tracking-widest uppercase">
          Routing to your configured department
          board...
        </p>
      </div>
    </div>
  );
}
