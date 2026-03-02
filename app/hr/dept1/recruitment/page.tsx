"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  MoreHorizontal,
  Mail,
  Calendar,
  AlertCircle,
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

const STAGES = [
  {
    id: "applied",
    label: "Applied",
    color: "blue",
  },
  {
    id: "screening",
    label: "Screening",
    color: "amber",
  },
  {
    id: "interview",
    label: "Interview",
    color: "purple",
  },
  {
    id: "offered",
    label: "Offered",
    color: "emerald",
  },
  {
    id: "rejected",
    label: "Rejected",
    color: "red",
  },
];

export default function RecruitmentWorkflowPage() {
  const supabase = createClient();
  const router = useRouter();
  const [applicants, setApplicants] = useState<
    any[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchApplicants();

    const channel = supabase
      .channel("recruitment_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "applicant_management",
        },
        fetchApplicants,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("applicant_management")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) setApplicants(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: string,
  ) => {
    try {
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("applicant_management")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success(
        `Applicant moved to ${newStatus}`,
      );
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to update status",
      );
    }
  };

  const filtered = applicants.filter((a) =>
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
            Recruitment Pipeline
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Move candidates through the screening
            workflow
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="pl-10 h-11 rounded-2xl bg-white border-none shadow-sm font-bold"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-2xl shadow-sm border border-slate-50">
          {STAGES.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-1.5 px-3 py-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default"
            >
              <div
                className={`h-1.5 w-1.5 rounded-full bg-${s.color}-500`}
              />
              <span className="text-[10px] font-black uppercase text-slate-900">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <Card className="border-none shadow-sm rounded-[32px] p-20 text-center animate-pulse font-black text-slate-300">
            Loading Pipeline...
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-sm rounded-[32px] p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest">
            No candidates in pipeline
          </Card>
        ) : (
          filtered.map((a) => (
            <Card
              key={a.id}
              className="border-none shadow-2xl shadow-slate-100/30 rounded-[32px] overflow-hidden bg-white hover:ring-2 hover:ring-blue-100 transition-all"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-6 md:p-8 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl uppercase tracking-tighter shadow-inner">
                        {a.first_name[0]}
                        {a.last_name[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">
                          {a.first_name}{" "}
                          {a.last_name}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {a.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Applied{" "}
                          {new Date(
                            a.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-xl font-bold text-blue-600 hover:bg-blue-50"
                      >
                        <Mail className="h-3.5 w-3.5 mr-2" />{" "}
                        Contact
                      </Button>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center min-w-[320px]">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">
                      Current Progress Stage
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 mb-6">
                      {STAGES.filter(
                        (s) =>
                          s.id !== "rejected",
                      ).map((s) => {
                        const isActive =
                          a.status === s.id;
                        const isPast =
                          STAGES.findIndex(
                            (x) =>
                              x.id === a.status,
                          ) >
                          STAGES.findIndex(
                            (x) => x.id === s.id,
                          );
                        return (
                          <div
                            key={s.id}
                            className="h-1.5 rounded-full bg-slate-200 relative overflow-hidden"
                          >
                            {(isActive ||
                              (isPast &&
                                a.status !==
                                  "rejected")) && (
                              <div
                                className={`absolute inset-0 bg-${s.color}-500`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      {a.status !== "rejected" &&
                      a.status !== "offered" ? (
                        <>
                          <Button
                            onClick={() =>
                              handleUpdateStatus(
                                a.id,
                                STAGES[
                                  STAGES.findIndex(
                                    (s) =>
                                      s.id ===
                                      a.status,
                                  ) + 1
                                ].id,
                              )
                            }
                            className="flex-1 bg-slate-900 text-white font-black rounded-xl h-12 shadow-lg"
                          >
                            Move Forward{" "}
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                          <Button
                            onClick={() =>
                              handleUpdateStatus(
                                a.id,
                                "rejected",
                              )
                            }
                            variant="ghost"
                            className="h-12 w-12 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <AlertCircle className="h-5 w-5" />
                          </Button>
                        </>
                      ) : (
                        <div
                          className={`w-full py-4 rounded-xl text-center font-black text-[10px] uppercase tracking-[0.2em] ${
                            a.status === "offered"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          Process {a.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
