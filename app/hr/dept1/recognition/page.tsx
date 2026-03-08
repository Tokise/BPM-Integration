"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Award,
  Sparkles,
  Heart,
  Search,
  Download,
  Zap,
  Trophy,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import { generateAutoRecognition } from "@/app/actions/hr";
import { toast } from "sonner";
import { CertificateModal } from "@/components/hr/CertificateModal";

export default function RecognitionPage() {
  const supabase = createClient();
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

  const handleExportPDF = async () => {}; // Replaced by modal

  const filteredEmps = employees.filter((emp) =>
    emp.full_name
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Social Recognition
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Celebrate employee achievements across
            performance, learning & career paths
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleAutoGenerate}
            variant="outline"
            className="border-2 border-slate-200 text-slate-600 font-black rounded-xl h-12 px-6 hover:bg-slate-50"
          >
            <Zap className="h-5 w-5 mr-2" /> Sync
            Achievements
          </Button>
          <Button
            onClick={() => {
              setSelectedEmp(null);
              setIsModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200"
          >
            <Sparkles className="h-5 w-5" /> Issue
            Custom
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Search by employee name..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="pl-12 h-14 rounded-2xl bg-white border-none shadow-xl shadow-slate-100/50 font-bold"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Categories */}
        <div className="md:col-span-2 space-y-10">
          {groupedRecs.length === 0 ? (
            <Card className="border-none shadow-sm rounded-[32px] p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest bg-white">
              No recognitions found
            </Card>
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
                      className="border-none shadow-xl shadow-slate-100/50 rounded-3xl bg-white hover:-translate-y-1 transition-all group cursor-pointer border-2 border-transparent hover:border-slate-200"
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
                              View Certificate
                            </div>
                          </div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                            {rec.title}
                          </p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2 italic">
                            "{rec.message}"
                          </p>
                          <div className="flex items-center gap-4 mt-4">
                            <span
                              className={`text-[10px] font-black ${cat.color} ${cat.bg} px-2 py-1 rounded-lg uppercase tracking-widest`}
                            >
                              +{rec.points} Points
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

        {/* Stats Column */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl shadow-indigo-100/50 rounded-[40px] overflow-hidden bg-white">
            <CardContent className="p-10 text-center py-16">
              <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/50 relative">
                <Heart className="h-10 w-10 fill-current" />
                <Sparkles className="h-6 w-6 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
              </div>
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">
                {recognitions.length}
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 leading-relaxed">
                Achievements Celebrated
                System-Wide
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] bg-slate-900 text-white p-8">
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                Breakdown
              </h3>
              {categories.map((cat) => {
                const count = recognitions.filter(
                  (r) =>
                    (r.category ||
                      "Performance") === cat.id,
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
        // Only pass employees list if we are issuing a new award
        employees={!selectedEmp ? employees : []}
        onEmployeeSelect={setSelectedEmp}
      />
    </div>
  );
}
