"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Award,
  Sparkles,
  Heart,
  Search,
  Zap,
  Eye,
  Trophy,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { generateAutoRecognition } from "@/app/actions/hr";
import { toast } from "sonner";
import { CertificateModal } from "@/components/hr/CertificateModal";
import { useRouter } from "next/navigation";

export default function HR2RecognitionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [recognitions, setRecognitions] =
    useState<any[]>([]);
  const [employees, setEmployees] = useState<
    any[]
  >([]);
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] =
    useState<any>(null);
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [certLayout, setCertLayout] = useState<
    "classic" | "modern"
  >("classic");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [recRes, empRes] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("social_recognition")
        .select(
          "*, receiver:profiles!receiver_id(full_name)",
        )
        .order("created_at", {
          ascending: false,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .select("*")
        .not(
          "role",
          "in",
          '("customer","seller","Customer","Seller")',
        )
        .order("full_name", { ascending: true }),
    ]);

    if (recRes.data) setRecognitions(recRes.data);
    if (empRes.data) setEmployees(empRes.data);
  };

  const handleAutoGenerate = async () => {
    const tid = toast.loading(
      "Analyzing top performers...",
    );
    try {
      const res = await generateAutoRecognition();
      if (res.success) {
        toast.success(
          `Successfully generated ${res.count} new achievement(s)!`,
          { id: tid },
        );
        fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast.error(
        e.message || "Auto-generation failed",
        { id: tid },
      );
    }
  };

  const filteredRecs = recognitions.filter((r) =>
    (r.receiver?.full_name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const categories = [
    {
      id: "Performance",
      label: "Employee of the Month",
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      id: "Learning",
      label: "Learning Achievements",
      icon: Award,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "Training",
      label: "Training Achievements",
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      id: "Promotion",
      label: "Promotion Achievements",
      icon: Sparkles,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ];

  const groupedRecs = categories
    .map((cat) => ({
      ...cat,
      items: filteredRecs.filter(
        (r) =>
          (r.category || "Performance") ===
          cat.id,
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() =>
                router.push("/hr/dept2")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 bg-white">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to HR2
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-500" />
              Social Recognition
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 pl-11">
              Celebrating milestones & excellence
              across HR2
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleAutoGenerate}
              variant="ghost"
              size="sm"
              className="h-10 text-amber-600 hover:bg-amber-50 rounded-xl px-4 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
            >
              <Zap className="h-4 w-4" /> Sync
            </Button>
          </div>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <Input
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="pl-12 h-14 rounded-2xl bg-white border-none shadow-xl shadow-slate-100/50 font-bold focus-visible:ring-amber-500"
          />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-10">
            {groupedRecs.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[40px] border border-slate-50 shadow-sm">
                <Award className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
                  No recognitions found
                </p>
              </div>
            ) : (
              groupedRecs.map((cat) => (
                <div
                  key={cat.id}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 px-2">
                    <cat.icon
                      className={`h-5 w-5 ${cat.color}`}
                    />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                      {cat.label}
                    </h2>
                  </div>

                  <div className="grid gap-4">
                    {cat.items.map((rec) => (
                      <Card
                        key={rec.id}
                        onClick={() => {
                          const emp =
                            employees.find(
                              (e) =>
                                e.id ===
                                rec.receiver_id,
                            );
                          if (emp) {
                            setSelectedEmp({
                              ...emp,
                              currentTitle:
                                rec.title,
                              currentDate:
                                rec.created_at,
                            });
                            setIsModalOpen(true);
                          }
                        }}
                        className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] bg-white hover:-translate-y-1 transition-all group cursor-pointer border-2 border-transparent hover:border-slate-200"
                      >
                        <CardContent className="p-6 flex items-center gap-6">
                          <div
                            className={`h-16 w-16 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors`}
                          >
                            <cat.icon className="h-8 w-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-black text-slate-900 truncate">
                                {rec.receiver
                                  ?.full_name ||
                                  "Employee"}
                              </h3>
                              <div
                                className={`flex items-center gap-1 text-[10px] font-black ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest`}
                              >
                                <Eye className="h-3 w-3" />{" "}
                                View Cert
                              </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              {rec.title}
                            </p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed italic line-clamp-2">
                              "{rec.message}"
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                              <span
                                className={`text-[10px] font-black ${cat.color} ${cat.bg} px-2 py-1 rounded-lg uppercase tracking-widest`}
                              >
                                +{rec.points}{" "}
                                Points
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {new Date(
                                  rec.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl shadow-indigo-100/50 rounded-[40px] overflow-hidden bg-white">
              <CardContent className="p-10 text-center py-16">
                <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-50/50">
                  <Heart className="h-12 w-12 fill-current" />
                </div>
                <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">
                  {recognitions.length}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Global Achievements
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] bg-slate-900 text-white p-8">
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Breakdown
                </h3>
                {categories.map((cat) => {
                  const count =
                    recognitions.filter(
                      (r) =>
                        (r.category ||
                          "Performance") ===
                        cat.id,
                    ).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 ${cat.bg} ${cat.color} rounded-lg flex items-center justify-center`}
                        >
                          <cat.icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {cat.id}
                        </span>
                      </div>
                      <span className="text-lg font-black">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CertificateModal
        open={isModalOpen}
        onOpenChange={(op) => {
          setIsModalOpen(op);
          if (!op) setSelectedEmp(null);
        }}
        employeeName={selectedEmp?.full_name}
        achievementTitle={
          selectedEmp?.currentTitle ||
          "Excellence Recognition"
        }
        date={
          selectedEmp?.currentDate
            ? new Date(
                selectedEmp.currentDate,
              ).toLocaleDateString()
            : new Date().toLocaleDateString()
        }
        layout={certLayout}
        // Only pass employees list if we are issued a new award (not viewing an existing one)
        employees={!selectedEmp ? employees : []}
        onEmployeeSelect={setSelectedEmp}
      />
    </div>
  );
}
