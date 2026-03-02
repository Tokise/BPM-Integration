"use client";

import { useEffect, useState } from "react";
import {
  Star,
  Search,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PreEmploymentPerformancePage() {
  const supabase = createClient();
  const router = useRouter();
  const [candidates, setCandidates] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    // Fetch applicants who are in screening/interview or offered
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("applicant_management")
      .select("*")
      .in("status", [
        "screening",
        "interview",
        "offered",
      ])
      .order("updated_at", { ascending: false });

    if (data) setCandidates(data);
    setLoading(false);
  };

  const handleRate = async (
    id: string,
    field: string,
    val: number,
  ) => {
    // This is a mock UI update for now as we don't have a specific table for candidate ratings,
    // but we could use JSONB in applicant_management or a related table.
    toast.success(
      `Candidate rated ${val} stars for ${field}`,
    );
  };

  const filtered = candidates.filter((a) =>
    `${a.first_name} ${a.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/hr/dept1")}
          className="rounded-xl h-11 px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />{" "}
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Candidate Performance
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Evaluate and track talent during
            screening
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search candidates for evaluation..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-10 h-14 rounded-3xl bg-white border-none shadow-xl font-bold"
            />
          </div>

          <div className="grid gap-4">
            {loading ? (
              <Card className="border-none shadow-sm rounded-[32px] p-20 text-center animate-pulse font-black text-slate-300">
                Loading Evaluations...
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[32px] p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest">
                No candidates in evaluation phase
              </Card>
            ) : (
              filtered.map((a) => (
                <Card
                  key={a.id}
                  className="border-none shadow-2xl shadow-slate-100/20 rounded-[32px] overflow-hidden bg-white hover:ring-2 hover:ring-indigo-100 transition-all"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                          {a.first_name[0]}
                          {a.last_name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 leading-none mb-1">
                            {a.first_name}{" "}
                            {a.last_name}
                          </h3>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                            {a.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Culture Match
                        </p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(
                            (i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i <= 4 ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-50">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Technical Skill
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(
                              (i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    handleRate(
                                      a.id,
                                      "tech",
                                      i,
                                    )
                                  }
                                  className={`h-2.5 w-6 rounded-sm cursor-pointer ${i <= 3 ? "bg-blue-500" : "bg-slate-100 hover:bg-blue-100"}`}
                                />
                              ),
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Communication
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(
                              (i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    handleRate(
                                      a.id,
                                      "comm",
                                      i,
                                    )
                                  }
                                  className={`h-2.5 w-6 rounded-sm cursor-pointer ${i <= 4 ? "bg-indigo-500" : "bg-slate-100 hover:bg-indigo-100"}`}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Problem Solving
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(
                              (i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    handleRate(
                                      a.id,
                                      "ps",
                                      i,
                                    )
                                  }
                                  className={`h-2.5 w-6 rounded-sm cursor-pointer ${i <= 4 ? "bg-purple-500" : "bg-slate-100 hover:bg-purple-100"}`}
                                />
                              ),
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Engagement
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(
                              (i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    handleRate(
                                      a.id,
                                      "eng",
                                      i,
                                    )
                                  }
                                  className={`h-2.5 w-6 rounded-sm cursor-pointer ${i <= 5 ? "bg-emerald-500" : "bg-slate-100 hover:bg-emerald-100"}`}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-[10px] font-medium text-slate-400 italic">
                        "Very strong potential,
                        specifically in team
                        collaboration."
                      </p>
                      <Button
                        variant="ghost"
                        className="rounded-xl h-10 px-4 text-xs font-black text-slate-900 group"
                      >
                        {" "}
                        Full Report{" "}
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />{" "}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl shadow-indigo-100/50 rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-8">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Overall Health
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Selection Ratio
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      14%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[14%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Time to Hire
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      18d
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-blue-500 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl shadow-slate-100/30 rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-8 text-center py-12">
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 leading-none">
                Top Talent
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">
                Identify high-potential candidates
                easily
              </p>
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl h-14 shadow-xl">
                Generate Insights{" "}
                <TrendingUp className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
