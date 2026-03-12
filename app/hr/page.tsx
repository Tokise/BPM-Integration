"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  FileCheck,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HRDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { profile, loading: userLoading } =
    useUser();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    newHires: 0,
    pendingApplications: 0,
    onLeave: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && profile) {
      // 1. Redirect if user has a specific department code
      if (
        profile?.department?.code?.startsWith(
          "HR_DEPT",
        )
      ) {
        const deptNumber = profile.department.code
          .split("_")[1]
          .toLowerCase();
        router.replace(`/hr/${deptNumber}`);
        return;
      }
      fetchStats();
    }
  }, [profile, userLoading, router]);

  const fetchStats = async () => {
    // ... stats fetching logic stays the same
    setLoading(true);

    const { data: rolesData } = await supabase
      .schema("bpm-anec-global")
      .from("roles")
      .select("id, name");

    const roleIds = (rolesData || [])
      .filter(
        (r: any) =>
          !["customer", "seller"].includes(
            r.name?.toLowerCase(),
          ),
      )
      .map((r: any) => r.id);

    const today = new Date()
      .toISOString()
      .split("T")[0];
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];

    const [
      employeesRes,
      newHiresRes,
      applicantsRes,
      leaveRes,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("role_id", roleIds),
      supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("role_id", roleIds)
        .gte("updated_at", sevenDaysAgo),
      supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "applied"),
      supabase
        .schema("bpm-anec-global")
        .from("leave_management")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today),
    ]);

    setStats({
      totalEmployees: employeesRes.count ?? 0,
      newHires: newHiresRes.count ?? 0,
      pendingApplications:
        applicantsRes.count ?? 0,
      onLeave: leaveRes.count ?? 0,
    });

    setLoading(false);
  };

  if (
    userLoading ||
    (loading && stats.totalEmployees === 0)
  ) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const isHRRole =
    profile?.role?.includes("hr") ||
    profile?.role === "admin";

  if (!isHRRole) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center px-4">
        <div className="h-20 w-20 rounded-[32px] bg-red-50 flex items-center justify-center mb-6 shadow-sm border border-red-100">
          <Users className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Access Denied
        </h2>
        <p className="text-slate-500 mt-3 max-w-md font-medium">
          Your account is not authorized to access
          the HR Management Dashboard. Please
          contact your department manager for
          access.
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

  const statCards = [
    {
      label: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "blue",
      sub: "Active workforce",
    },
    {
      label: "New Hires",
      value: stats.newHires,
      icon: UserPlus,
      color: "emerald",
      sub: "Past 7 days",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications,
      icon: FileCheck,
      color: "amber",
      sub: "Awaiting review",
    },
    {
      label: "On Leave",
      value: stats.onLeave,
      icon: Calendar,
      color: "purple",
      sub: "Currently out",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          HR Dashboard
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Talent & Workforce Management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card
            key={idx}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-300 bg-white relative"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${stat.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8 relative">
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {stat.label}
              </p>
              <h3 className="text-4xl font-black text-slate-900 mt-1">
                {loading ? (
                  <span className="animate-pulse text-slate-300">
                    ...
                  </span>
                ) : (
                  stat.value
                )}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
