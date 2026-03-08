"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Target,
  Zap,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
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

export default function HRDept2Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeCourses: 0,
    completionRate: 0,
    skillsTracked: 0,
    readinessStatus: "",
    trainingData: [] as any[],
    competencyData: [] as any[],
    recentEnrollments: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Real-time sync for Dept 2
    const trainingSync = supabase
      .channel("hr_dept2_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "training_management",
        },
        fetchStats,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(trainingSync);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const [
      courses,
      training,
      competency,
      succession,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("learning_management")
        .select("id", {
          count: "exact",
          head: true,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("training_management")
        .select("status"),
      supabase
        .schema("bpm-anec-global")
        .from("competency_management")
        .select("id", {
          count: "exact",
          head: true,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("succession_planning")
        .select("readiness_status"),
      supabase
        .schema("bpm-anec-global")
        .from("training_management")
        .select(
          `
          id,
          created_at,
          employee_name,
          training_name,
          learning_management (
            course_name
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const totalTraining =
      training.data?.length || 0;
    const completedTraining =
      training.data?.filter(
        (t) => t.status === "completed",
      ).length || 0;
    const rate = totalTraining
      ? Math.round(
          (completedTraining / totalTraining) *
            100,
        )
      : 0;

    const readyCount =
      succession.data?.filter(
        (s) => s.readiness_status === "ready",
      ).length || 0;
    const totalSuccession =
      succession.data?.length || 0;
    const readiness = totalSuccession
      ? Math.round(
          (readyCount / totalSuccession) * 100,
        )
      : 0;

    // Process training data for charts
    const trainingStatuses = [
      "pending",
      "in_progress",
      "completed",
    ];
    const trainingData = trainingStatuses.map(
      (status) => ({
        name:
          status
            .replace("_", " ")
            .charAt(0)
            .toUpperCase() +
          status.replace("_", " ").slice(1),
        value:
          training.data?.filter(
            (t) => t.status === status,
          ).length || 0,
        color:
          status === "pending"
            ? "#F59E0B"
            : status === "in_progress"
              ? "#3B82F6"
              : "#10B981",
      }),
    );

    setStats({
      activeCourses: courses.count || 0,
      completionRate: rate,
      skillsTracked: competency.count || 0,
      readinessStatus: `${readiness}%`,
      trainingData: trainingData,
      competencyData: [
        {
          name: "Core",
          value: 40,
          color: "#82ca9d",
        },
        {
          name: "Technical",
          value: 30,
          color: "#8884d8",
        },
        {
          name: "Leadership",
          value: 20,
          color: "#ffc658",
        },
      ],
      recentEnrollments:
        (training as any).data || [],
    });
    setLoading(false);
  };

  const cards = [
    {
      label: "Active Courses",
      val: stats.activeCourses,
      icon: BookOpen,
      color: "blue",
      sub: "Available in L&D catalogue",
    },
    {
      label: "Completion Rate",
      val: `${stats.completionRate}%`,
      icon: CheckCircle2,
      color: "emerald",
      sub: "Overall training progress",
    },
    {
      label: "Skills Tracked",
      val: stats.skillsTracked,
      icon: GraduationCap,
      color: "purple",
      sub: "Unique competencies logged",
    },
    {
      label: "Readiness Rate",
      val: stats.readinessStatus,
      icon: TrendingUp,
      color: "amber",
      sub: "Succession plan status",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Dept 2: L&D
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Learning, Development & Succession
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Learning",
            desc: "Course catalog & e-learning",
            path: "/hr/dept2/learning",
            icon: BookOpen,
            color: "purple",
          },
          {
            title: "Training",
            desc: "Session tracking & history",
            path: "/hr/dept2/training",
            icon: GraduationCap,
            color: "blue",
          },
          {
            title: "Competency",
            desc: "Skills matrix & evaluations",
            path: "/hr/dept2/competency",
            icon: Target,
            color: "emerald",
          },
          {
            title: "Succession",
            desc: "Readiness & bench strength",
            path: "/hr/dept2/succession",
            icon: Zap,
            color: "amber",
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
              <div className="mt-4 flex justify-end">
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
              Training Progress
              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                Performance
              </span>
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={stats.trainingData}
                >
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
                    {stats.trainingData.map(
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
              Skills Distribution
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Gap Analysis
              </span>
            </h2>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={stats.competencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.competencyData.map(
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
                  Skills
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {stats.skillsTracked}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-6">
              Course Enrollments
            </h2>
            <div className="space-y-4">
              {stats.recentEnrollments.length >
              0 ? (
                stats.recentEnrollments.map(
                  (enroll) => {
                    const date = new Date(
                      enroll.created_at,
                    );
                    const now = new Date();
                    const diffMs =
                      now.getTime() -
                      date.getTime();
                    const diffHrs = Math.floor(
                      diffMs / (1000 * 60 * 60),
                    );
                    const timeAgo =
                      diffHrs < 1
                        ? "Just now"
                        : `${diffHrs}h ago`;

                    return (
                      <div
                        key={enroll.id}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">
                            {enroll.employee_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {enroll.training_name ||
                              enroll
                                .learning_management
                                ?.course_name ||
                              "Untitled Course"}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase">
                          {timeAgo}
                        </span>
                      </div>
                    );
                  },
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No recent enrollments
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
