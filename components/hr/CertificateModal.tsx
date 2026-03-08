"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Award,
  Download,
  Printer,
  Search,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Input } from "@/components/ui/input"; // Added Input import

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName?: string;
  achievementTitle: string;
  date: string;
  issuer?: string;
  layout?: "classic" | "modern";
  employees?: any[]; // Optional for selection
  onEmployeeSelect?: (emp: any) => void;
}

export function CertificateModal({
  open,
  onOpenChange,
  employeeName: initialName,
  achievementTitle,
  date,
  issuer = "HR Strategic Command",
  layout: initialLayout = "classic",
  employees = [],
  onEmployeeSelect,
}: CertificateModalProps) {
  const [exporting, setExporting] =
    useState(false);
  const [layout, setLayout] = useState<
    "classic" | "modern"
  >(initialLayout);
  const [selectedEmpName, setSelectedEmpName] =
    useState(initialName || "");
  const [search, setSearch] = useState("");

  // Sync selected name when initialName changes (e.g. when opening from a recognition)
  useEffect(() => {
    if (initialName) {
      setSelectedEmpName(initialName);
    }
  }, [initialName]);

  const handleExportPDF = async () => {
    const certNode = document.getElementById(
      "certificate-print-node",
    );
    if (!certNode) return;

    setExporting(true);
    const tid = toast.loading(
      "Generating certificate...",
    );

    try {
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

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        297,
        210,
      );
      pdf.save(
        `Certificate_${selectedEmpName.replace(/\s+/g, "_")}.pdf`,
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
      toast.error("Failed to generate PDF", {
        id: tid,
      });
    } finally {
      setExporting(false);
    }
  };

  const filteredEmps = employees.filter((emp) =>
    emp.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-6xl p-0 overflow-hidden border-none shadow-2xl rounded-[32px] bg-white fixed top-[55%] left-[50%] -translate-x-[50%] -translate-y-1/2">
        <DialogHeader className="sr-only">
          <DialogTitle>
            Award Center & Certificate Issuer
          </DialogTitle>
          <DialogDescription>
            Preview and print your official
            certificate.
          </DialogDescription>
        </DialogHeader>

        {/* Global Export Button - Top Right */}
        <div className="absolute top-6 right-16 z-[100] flex items-center gap-4">
          <Button
            onClick={handleExportPDF}
            disabled={
              exporting ||
              (!selectedEmpName && !initialName)
            }
            className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-11 px-6 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Download className="h-5 w-5" />
            <span>EXPORT PDF</span>
          </Button>
        </div>

        <div
          className={`flex h-[750px] ${initialName ? "justify-center bg-slate-50/10" : ""}`}
        >
          {/* Sidebar: Selection & Settings - Hidden if name is fixed */}
          {!initialName && (
            <div className="w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col gap-6 overflow-hidden">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Award Center
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Certificate Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setLayout("classic")
                      }
                      className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        layout === "classic"
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-white text-slate-400 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      Classic
                    </button>
                    <button
                      onClick={() =>
                        setLayout("modern")
                      }
                      className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        layout === "modern"
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-white text-slate-400 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      Modern
                    </button>
                  </div>
                </div>

                {employees.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Select Recipient
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search name..."
                        value={search}
                        onChange={(e) =>
                          setSearch(
                            e.target.value,
                          )
                        }
                        className="pl-10 h-10 rounded-xl bg-white border-slate-200 font-bold text-xs"
                      />
                    </div>

                    <div className="h-[250px] overflow-y-auto pr-2 space-y-2">
                      {filteredEmps.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmpName(
                              emp.full_name,
                            );
                            if (onEmployeeSelect)
                              onEmployeeSelect(
                                emp,
                              );
                          }}
                          className={`p-4 rounded-2xl cursor-pointer transition-all ${
                            selectedEmpName ===
                            emp.full_name
                              ? "bg-white text-amber-700 shadow-xl ring-2 ring-amber-500"
                              : "hover:bg-white/50 text-slate-600"
                          }`}
                        >
                          <p className="text-sm font-black">
                            {emp.full_name}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                            {emp.role}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">
                  Select a recipient to generate
                  preview
                </p>
              </div>
            </div>
          )}

          {/* Certificate Preview - Full width if sidebar hidden */}
          <div
            className={`${initialName ? "w-full max-w-4xl p-16" : "w-2/3 p-12"} flex flex-col items-center justify-center bg-white relative overflow-hidden`}
          >
            {initialName && (
              <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm transition-all">
                  <button
                    onClick={() =>
                      setLayout("classic")
                    }
                    className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      layout === "classic"
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() =>
                      setLayout("modern")
                    }
                    className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      layout === "modern"
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Modern
                  </button>
                </div>
              </div>
            )}

            <div
              id="certificate-print-node"
              className={`w-full aspect-[1.414/1] p-1 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-700 bg-white ${
                layout === "classic"
                  ? "border-[24px] border-slate-50"
                  : "border-[1px] border-slate-100 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20"
              }`}
            >
              {layout === "classic" ? (
                <>
                  <div className="absolute inset-0 border-[1px] border-amber-500/10 m-2" />
                  <div className="absolute inset-0 border-[2px] border-double border-amber-500/20 m-4" />

                  <div className="relative mb-8">
                    <div className="absolute -inset-6 bg-amber-50 rounded-full blur-2xl opacity-50" />
                    <Award className="h-20 w-20 text-amber-500 relative transition-transform duration-500 hover:scale-110" />
                  </div>

                  <h2 className="text-3xl font-serif text-slate-900 mb-2 tracking-tight">
                    Certificate of Achievement
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">
                    This acknowledges that
                  </p>
                  <h1
                    className={`font-black text-amber-600 mb-4 max-w-[85%] mx-auto leading-tight italic drop-shadow-sm break-words px-4 ${
                      selectedEmpName.length > 25
                        ? "text-2xl"
                        : selectedEmpName.length >
                            15
                          ? "text-3xl"
                          : "text-4xl"
                    }`}
                  >
                    {selectedEmpName ||
                      "Recipient Name"}
                  </h1>
                  <p className="text-[11px] text-slate-500 max-w-[70%] mx-auto leading-relaxed font-bold italic mb-6 px-6">
                    Has successfully completed the
                    requirements for
                    <br />
                    <span className="font-black text-slate-800 not-italic uppercase tracking-widest mt-2 block leading-tight text-sm">
                      {achievementTitle}
                    </span>
                  </p>
                  <div className="absolute bottom-10 left-12 text-left">
                    <div className="w-16 border-b-2 border-slate-100 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                      Issue Date
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {date}
                    </p>
                  </div>
                  <div className="absolute bottom-10 right-12 text-right">
                    <div className="w-16 border-b-2 border-slate-100 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                      Authorized By
                    </p>
                    <p className="text-xs font-black text-slate-800 uppercase mt-1">
                      {issuer}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Modern Layout */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-3xl animate-pulse" />

                  <div className="relative z-10 flex flex-col items-center w-full px-12">
                    <div className="h-20 w-20 bg-slate-950 text-white rounded-[24px] flex items-center justify-center mb-6 rotate-3 shadow-2xl">
                      <Award className="h-10 w-10 text-amber-400" />
                    </div>

                    <p className="text-[7px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 font-mono">
                      // OFFICIAL CERTIFICATION
                    </p>

                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800">
                      Award of Excellence
                    </h1>

                    <div className="h-[1px] w-24 bg-slate-200 mb-8" />

                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      THIS IS PRESENTED TO
                    </p>

                    <h2
                      className={`font-black text-slate-900 mb-6 tracking-tighter uppercase italic leading-[1.1] break-words max-w-[90%] mx-auto ${
                        (
                          selectedEmpName ||
                          "RECIPIENT"
                        ).length > 25
                          ? "text-xl"
                          : (
                                selectedEmpName ||
                                "RECIPIENT"
                              ).length > 15
                            ? "text-2xl"
                            : "text-3xl"
                      }`}
                    >
                      {selectedEmpName ||
                        "RECIPIENT"}
                    </h2>

                    <div className="bg-slate-950 text-white px-6 py-3 rounded-xl shadow-2xl mb-8 border border-slate-800 max-w-[90%]">
                      <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                        {achievementTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-12 mt-2">
                      <div className="text-center">
                        <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest mb-1">
                          Verified Date
                        </p>
                        <p className="text-xs font-black text-slate-900">
                          {date}
                        </p>
                      </div>
                      <div className="h-8 w-[1px] bg-slate-100" />
                      <div className="text-center">
                        <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest mb-1">
                          Authenticated by
                        </p>
                        <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">
                          {issuer}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-8 left-8 text-[5px] font-black text-slate-200 tracking-[1em] rotate-90 origin-left">
                    ANEC GLOBAL EXCELLENCE •{" "}
                    {date} •{" "}
                    {issuer.toUpperCase()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
