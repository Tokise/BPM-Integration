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

  const handleExportPDF = async () => {
    if (!selectedEmp) return;
    const certNode = document.getElementById(
      "certificate-node",
    );
    if (!certNode) return;

    const tid = toast.loading(
      "Generating certificate...",
    );

    try {
      // Use html-to-image which is much more robust with modern CSS/SVGs
      const dataUrl = await htmlToImage.toPng(
        certNode,
        {
          pixelRatio: 4,
          skipFonts: false,
        },
      );

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 297; // A4 landscape width
      const imgHeight = 210; // A4 landscape height

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight,
      );
      pdf.save(
        `Certificate_${selectedEmp.full_name.replace(/\s+/g, "_")}.pdf`,
      );
      toast.success(
        "Certificate exported successfully!",
        { id: tid },
      );
    } catch (error) {
      console.error(
        "PDF generation failed",
        error,
      );
      toast.error(
        "PDF Generation failed. Try again.",
        { id: tid },
      );
    }
  };

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Social Recognition
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Celebrate employee achievements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
                <Sparkles className="h-5 w-5" />{" "}
                Issue Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl rounded-xl border-none shadow-2xl p-0 overflow-hidden bg-white fixed top-[55%] left-[50%] -translate-x-[50%] -translate-y-1/2">
              <DialogTitle className="sr-only">
                Award Center & Certificate Issuer
              </DialogTitle>
              <DialogDescription className="sr-only">
                Preview and export excellence
                certificates for employees.
              </DialogDescription>
              <div className="flex h-[700px]">
                {/* Sidebar / Form */}
                <div className="w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        Award Center
                      </h3>
                      <Button
                        onClick={
                          handleAutoGenerate
                        }
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:bg-amber-100/50 rounded-lg flex items-center justify-center"
                        title="Auto Generate"
                      >
                        <Zap className="h-4 w-4 fill-amber-600" />
                      </Button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 mb-4">
                      Honoring Excellence
                    </p>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search employee..."
                        className="pl-10 h-10 rounded-xl bg-white border-slate-200 font-bold text-xs"
                        value={search}
                        onChange={(e) =>
                          setSearch(
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredEmps.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-xs font-bold text-slate-400 italic">
                          No employees found
                        </p>
                      </div>
                    ) : (
                      filteredEmps.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() =>
                            setSelectedEmp(emp)
                          }
                          className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                            selectedEmp?.id ===
                            emp.id
                              ? "bg-white text-amber-700 shadow-xl shadow-amber-100/50 ring-2 ring-amber-500"
                              : "hover:bg-white/50 text-slate-600"
                          }`}
                        >
                          <p className="text-sm font-black">
                            {emp.full_name}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                            {emp.role}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    disabled={!selectedEmp}
                    onClick={handleExportPDF}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black shadow-2xl transition-all active:scale-95"
                  >
                    <Download className="mr-2 h-5 w-5" />{" "}
                    Export Global PDF
                  </Button>
                </div>

                {/* Certificate Preview */}
                <div className="w-2/3 p-12 flex items-center justify-center bg-white relative">
                  <div className="absolute top-8 right-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Preview Mode
                  </div>
                  <div
                    id="certificate-node"
                    className="w-full aspect-[1.414/1] bg-white border-[16px] border-slate-50 p-1 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl"
                  >
                    <div className="absolute inset-0 border-[1px] border-amber-500/10 m-2" />
                    <div className="absolute inset-0 border-[2px] border-double border-amber-500/20 m-4" />

                    <div className="relative mb-6">
                      <div className="absolute -inset-4 bg-amber-50 rounded-full blur-xl opacity-50" />
                      <Award className="h-16 w-16 text-amber-500 relative" />
                    </div>

                    <h2 className="text-2xl font-serif text-slate-900 mb-1 tracking-tight">
                      Certificate of Excellence
                    </h2>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">
                      is proudly presented to
                    </p>

                    <h1
                      className="text-xl font-black text-amber-600 mb-4 max-w-[80%] mx-auto leading-tight"
                      style={{
                        fontFamily:
                          "'Playfair Display', serif",
                      }}
                    >
                      {selectedEmp
                        ? selectedEmp.full_name
                        : "Recipient Name"}
                    </h1>

                    <p className="text-[8px] text-slate-500 max-w-[60%] mx-auto leading-relaxed font-medium italic mb-4 px-10">
                      In recognition of
                      outstanding performance,
                      unwavering dedication, and
                      consistently exceeding the
                      global standards of ANEC
                      Excellence.
                    </p>

                    <div className="absolute bottom-8 left-8 text-left">
                      <div className="w-16 border-b border-slate-200 mb-1" />
                      <p className="text-[5px] font-black uppercase tracking-widest text-slate-300">
                        Issuance Date
                      </p>
                      <p className="text-[8px] font-black text-slate-800">
                        {new Date().toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    <div className="absolute bottom-8 right-8 text-right">
                      <div className="w-16 border-b border-slate-200 mb-1" />
                      <p className="text-[5px] font-black uppercase tracking-widest text-slate-300">
                        Certified By
                      </p>
                      <p className="text-[8px] font-black text-slate-800">
                        HR Strategic Command
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main List */}
        <div className="md:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search recognition history..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-12 h-14 rounded-2xl bg-white border-none shadow-xl shadow-slate-100/50 font-bold"
            />
          </div>

          <div className="space-y-4">
            {filteredRecs.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[32px] p-20 text-center font-black text-slate-400 text-xs uppercase tracking-widest bg-white">
                No recognitions found
              </Card>
            ) : (
              filteredRecs.map((rec) => (
                <Card
                  key={rec.id}
                  onClick={() => {
                    const emp = employees.find(
                      (e) =>
                        e.id === rec.receiver_id,
                    );
                    if (emp) {
                      setSelectedEmp(emp);
                      setIsModalOpen(true);
                    }
                  }}
                  className="border-none shadow-xl shadow-slate-100/50 rounded-3xl bg-white hover:-translate-y-1 transition-all group cursor-pointer border-2 border-transparent hover:border-amber-200"
                >
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Award className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-black text-slate-900">
                          {rec.receiver
                            ?.full_name ||
                            "Unknown"}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                          <Eye className="h-3 w-3" />{" "}
                          View Certificate
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xl">
                        "{rec.message}"
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest">
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
              ))
            )}
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl shadow-indigo-100/50 rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-8 text-center py-12">
              <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
                <Heart className="h-10 w-10 fill-current" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                {recognitions.length}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
                Total Recognitions Given
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
