"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { AddApplicantModal } from "@/components/hr/AddApplicantModal";

export default function ApplicantsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [applicants, setApplicants] = useState<
    any[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();

    const channel = supabase
      .channel("applicants_realtime")
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
      .order("created_at", { ascending: false });

    if (data) setApplicants(data);
    setLoading(false);
  };

  const filteredApplicants = applicants.filter(
    (a) =>
      `${a.first_name} ${a.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      a.email
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter text-slate-900">
            Applicant Pool
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Manage your incoming talent pipeline
          </p>
        </div>
        <AddApplicantModal
          onExited={fetchApplicants}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-4 bg-white p-2 flex-1 rounded-3xl shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-10 h-11 rounded-2xl bg-slate-50 border-none font-bold"
            />
          </div>
          <Button
            variant="ghost"
            className="rounded-2xl h-11 px-6 font-black text-slate-400"
          >
            <Filter className="h-4 w-4 mr-2" />{" "}
            Filter
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Candidate
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Email
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Applied On
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-20 text-center animate-pulse font-black text-slate-300"
                    >
                      Loading Talent Pool...
                    </td>
                  </tr>
                ) : filteredApplicants.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest"
                    >
                      No applicants found
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold uppercase">
                            {a.first_name[0]}
                            {a.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {a.first_name}{" "}
                              {a.last_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Candidate
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-medium text-slate-600">
                        {a.email}
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            a.status === "applied"
                              ? "bg-blue-50 text-blue-600"
                              : a.status ===
                                  "screening"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-6 text-xs text-slate-500 font-medium">
                        {new Date(
                          a.created_at,
                        ).toLocaleDateString()}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {a.resume_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-9 px-3 rounded-xl font-black text-slate-400 hover:text-blue-600"
                            >
                              <a
                                href={
                                  a.resume_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 rounded-xl font-black text-slate-900 hover:bg-slate-100"
                          >
                            View{" "}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
