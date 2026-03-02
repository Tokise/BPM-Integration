"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  FileSearch,
  Award,
  ArrowRight,
  ChevronRight,
  Briefcase,
  Zap,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { AddApplicantModal } from "@/components/hr/AddApplicantModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function HRDept1Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalApplicants: 0,
    openPositions: 0,
    newHires: 0,
    recognitionPoints: 0,
    stageData: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Real-time subscription
    const applicantSubscription = supabase
      .channel("hr_dept1_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "applicant_management",
        },
        fetchStats,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        applicantSubscription,
      );
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      applicants,
      positions,
      hires,
      recognition,
      allApplicants,
    ] = await Promise.all([
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
        .from("recruitment_management")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "open"),
      supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("role", [
          "hr",
          "admin",
          "logistics",
          "finance",
        ])
        .gte("updated_at", thirtyDaysAgo),
      supabase
        .schema("bpm-anec-global")
        .from("social_recognition")
        .select("points"),
      supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .select("status"),
    ]);

    const totalPoints =
      recognition.data?.reduce(
        (acc, curr) => acc + (curr.points || 0),
        0,
      ) || 0;
    const avgPoints = recognition.data?.length
      ? Math.round(
          totalPoints / recognition.data.length,
        )
      : 0;

    // Process stage data for charts
    const stages = [
      "applied",
      "screening",
      "interview",
      "offered",
      "rejected",
    ];
    const stageCounts = stages.map((stage) => ({
      name:
        stage.charAt(0).toUpperCase() +
        stage.slice(1),
      value:
        allApplicants.data?.filter(
          (a) => a.status === stage,
        ).length || 0,
      color:
        stage === "applied"
          ? "#3B82F6"
          : stage === "screening"
            ? "#F59E0B"
            : stage === "interview"
              ? "#8B5CF6"
              : stage === "offered"
                ? "#10B981"
                : "#EF4444",
    }));

    setStats({
      totalApplicants: applicants.count || 0,
      openPositions: positions.count || 0,
      newHires: hires.count || 0,
      recognitionPoints: avgPoints,
      stageData: stageCounts,
    });
    setLoading(false);
  };

  const cards = [
    {
      label: "Pending Applicants",
      val: stats.totalApplicants,
      icon: FileSearch,
      color: "blue",
      sub: "Awaiting initial review",
    },
    {
      label: "Open Positions",
      val: stats.openPositions,
      icon: Briefcase,
      color: "indigo",
      sub: "Currently actively hiring",
    },
    {
      label: "Recent Hires",
      val: stats.newHires,
      icon: UserPlus,
      color: "emerald",
      sub: "Past 30 days",
    },
    {
      label: "Culture Score",
      val: stats.recognitionPoints,
      icon: Award,
      color: "amber",
      sub: "Avg. Recognition Points",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Dept 1: Recruitment
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Talent Acquisition & Culture
            Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddApplicantModal
            onExited={fetchStats}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all bg-white"
          >
            <CardContent className="p-8">
              <div
                className={`h-12 w-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-6`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {card.label}
              </p>
              <h3 className="text-4xl font-black text-slate-900 mt-1">
                {loading ? (
                  <span className="animate-pulse text-slate-200">
                    ...
                  </span>
                ) : (
                  card.val
                )}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Talent Pool",
            desc: "View all candidate applications",
            path: "/hr/dept1/applicants",
            icon: Users,
            color: "blue",
          },
          {
            title: "Screening",
            desc: "Move candidates through stages",
            path: "/hr/dept1/recruitment",
            icon: Briefcase,
            color: "amber",
          },
          {
            title: "Performance",
            desc: "Track applicant trial evaluations",
            path: "/hr/dept1/performance",
            icon: Zap,
            icon2: Target,
            color: "indigo",
          },
        ].map((nav) => (
          <Card
            key={nav.path}
            onClick={() => router.push(nav.path)}
            className="border-none shadow-xl shadow-slate-100/30 rounded-[32px] overflow-hidden bg-white cursor-pointer group hover:bg-slate-900 transition-all duration-500"
          >
            <CardContent className="p-8">
              <div
                className={`h-10 w-10 rounded-xl bg-${nav.color}-50 text-${nav.color}-600 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center mb-4 transition-colors`}
              >
                <nav.icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-black text-slate-900 group-hover:text-white transition-colors">
                {nav.title}
              </h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 group-hover:text-slate-500 transition-colors">
                {nav.desc}
              </p>
              <div className="mt-6 flex justify-end">
                <div className="h-8 w-8 rounded-full border border-slate-100 group-hover:border-white/20 flex items-center justify-center text-slate-300 group-hover:text-white transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
              Recruitment Funnel
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                Performance
              </span>
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={stats.stageData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow:
                        "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                    itemStyle={{
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 8, 8]}
                    barSize={40}
                  >
                    {stats.stageData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          fillOpacity={0.8}
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
              Applicant Distribution
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Volume
              </span>
            </h2>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={stats.stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.stageData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow:
                        "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                    itemStyle={{
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {stats.stageData.reduce(
                    (acc, curr) =>
                      acc + curr.value,
                    0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              Recent Applications
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-widest">
                Active
              </span>
            </h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">
                      JD
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        John Doe {i}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-xs">
                        Senior Frontend Dev
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl font-black text-blue-600"
                  >
                    View{" "}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6">
              Open Requisitions
            </h2>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-slate-900">
                      Warehouse Manager
                    </h4>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                      Urgent
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-4">
                    Logistics Dept • ₱45k - ₱60k
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((a) => (
                        <div
                          key={a}
                          className="h-6 w-6 rounded-full border-2 border-white bg-slate-200"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      12 applicants
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
