"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  FileSearch,
  Download,
  Share2,
  Archive,
  ShieldCheck,
  Clock,
  Search,
  Upload,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DTRSPage() {
  const supabase = createClient();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("document_tracking")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocs(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(
      `Uploading ${file.name}...`,
    );

    try {
      // 1. Upload file to Supabase Storage
      const ext = file.name.split(".").pop();
      const filePath = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from("logistics-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("logistics-documents")
        .getPublicUrl(filePath);

      // 3. Save metadata to document_tracking table
      const { data, error } = await supabase
        .schema("bpm-anec-global")
        .from("document_tracking")
        .insert({
          document_name: file.name,
          document_type:
            file.type ||
            "application/octet-stream",
          file_url: publicUrl,
          file_size: file.size,
          status: "verified",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Document Uploaded!", {
        id: toastId,
        description: `${file.name} tracked successfully.`,
      });
      setDocs((prev) => [data, ...prev]);
    } catch (err: any) {
      toast.error("Upload Failed", {
        id: toastId,
        description: err.message,
      });
    }

    setUploading(false);
    if (fileInputRef.current)
      fileInputRef.current.value = "";
  };

  const handleDownload = async (doc: any) => {
    if (doc.file_url) {
      // Trigger actual download
      const link = document.createElement("a");
      link.href = doc.file_url;
      link.download =
        doc.document_name || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started", {
        description: doc.document_name,
      });
    } else {
      toast.info("No file attached", {
        description:
          "This document has no downloadable file.",
      });
    }
  };

  const handleGenerateReport = () => {
    // Generate a text summary of all documents
    const reportLines = [
      "=== LOGISTICS DOCUMENT TRACKING REPORT ===",
      `Generated: ${new Date().toLocaleString("en-PH")}`,
      `Total Documents: ${docs.length}`,
      `Verified: ${docs.filter((d) => d.status === "verified").length}`,
      `Pending: ${docs.filter((d) => d.status !== "verified").length}`,
      "",
      "--- DOCUMENT LIST ---",
      ...docs.map(
        (d, i) =>
          `${i + 1}. ${d.document_name || "Untitled"} | Type: ${d.document_type || "N/A"} | Status: ${d.status || "Unknown"} | Date: ${d.created_at ? new Date(d.created_at).toLocaleDateString("en-PH") : "N/A"}`,
      ),
      "",
      "=== END OF REPORT ===",
    ];

    const blob = new Blob(
      [reportLines.join("\n")],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DTRS_Report_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Report Generated!", {
      description: "Text report downloaded.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = docs.filter((d) =>
    d.document_name
      ?.toLowerCase()
      .includes(search.toLowerCase()),
  );

  const stats = [
    {
      label: "Total Tracked Files",
      val: docs.length.toString(),
      icon: Archive,
      color: "blue",
    },
    {
      label: "Verified Documents",
      val: docs
        .filter(
          (d: any) => d.status === "verified",
        )
        .length.toString(),
      icon: ShieldCheck,
      color: "emerald",
    },
    {
      label: "Pending Verification",
      val: docs
        .filter(
          (d: any) => d.status !== "verified",
        )
        .length.toString(),
      icon: Clock,
      color: "amber",
    },
    {
      label: "Index Health",
      val: "100%",
      icon: FileSearch,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/logistic/dept1"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Document Tracking (DTRS)
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Document Tracking (DTRS)
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
            Logistics Repository • Dept 1
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            disabled={docs.length === 0}
            className="border-slate-200 text-slate-600 font-bold rounded-lg h-10 px-6 bg-white hover:bg-slate-50 text-[10px] uppercase tracking-widest"
          >
            <FilePlus className="h-4 w-4 mr-2 text-blue-500" />
            Generate Report
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.csv,.txt,.rtf,.odt,.ods"
          />
          <Button
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="bg-slate-900 text-white font-black rounded-lg h-10 px-6 shadow-sm hover:scale-[1.01] transition-transform text-[10px] uppercase tracking-widest"
          >
            {uploading ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading
              ? "UPLOADING..."
              : "UPLOAD DOCUMENT"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border shadow-sm rounded-lg overflow-hidden bg-white group"
          >
            <CardContent className="p-6">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors",
                  stat.color === "blue" &&
                    "bg-blue-50 text-blue-600",
                  stat.color === "amber" &&
                    "bg-amber-50 text-amber-600",
                  stat.color === "emerald" &&
                    "bg-emerald-50 text-emerald-600",
                  stat.color === "purple" &&
                    "bg-purple-50 text-purple-600",
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900">
                {loading ? "..." : stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">
            Document Repository
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Filter files..."
              className="pr-10 h-9 rounded-lg bg-white border-slate-200 font-bold text-slate-900 text-xs"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {loading ? (
              <p className="p-12 text-center text-slate-200 font-black animate-pulse uppercase tracking-widest text-[10px]">
                Loading repository index...
              </p>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-100 group-hover:bg-white transition-all shadow-sm shrink-0">
                      <FileText className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 leading-tight uppercase">
                        {doc.document_name}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                        {doc.id.slice(0, 8)} •{" "}
                        {doc.document_type ||
                          "General Data"}{" "}
                        •{" "}
                        {doc.created_at
                          ? format(
                              new Date(
                                doc.created_at,
                              ),
                              "MMM d, yyyy",
                            )
                          : "N/A"}
                        {doc.file_size
                          ? ` • ${formatFileSize(doc.file_size)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase rounded border tracking-widest",
                        doc.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-600 border-amber-100",
                      )}
                    >
                      {doc.status || "Pending"}
                    </div>
                    {doc.file_url ? (
                      <Button
                        onClick={() =>
                          handleDownload(doc)
                        }
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <Download className="h-3 w-3 mr-1.5" />
                        Download
                      </Button>
                    ) : (
                      <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest px-3">
                        No file
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <Archive className="h-12 w-12 text-slate-100 mx-auto mb-2" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  No matching documents found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
