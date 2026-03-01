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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Document Tracking (DTRS)
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Securely track & retrieve logistics
            documents, permits, and waybills.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            disabled={docs.length === 0}
            className="border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 bg-white hover:bg-slate-50"
          >
            <FilePlus className="h-4 w-4 mr-2" />
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
            className="bg-slate-900 text-white font-black rounded-xl h-11 px-6 shadow-lg hover:bg-slate-800 hover:scale-[1.02] transition-transform"
          >
            {uploading ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading
              ? "Uploading..."
              : "Upload Document"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
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
                (d) => d.status === "verified",
              )
              .length.toString(),
            icon: ShieldCheck,
            color: "emerald",
          },
          {
            label: "Pending Verification",
            val: docs
              .filter(
                (d) => d.status !== "verified",
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
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white relative group"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${stat.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8">
              <div
                className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-6`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {stat.label}
              </p>
              <p className="text-4xl font-black text-slate-900 mt-2">
                {loading ? "..." : stat.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 space-y-4">
          <CardTitle className="text-xl font-black">
            Document Repository
          </CardTitle>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search waybills, permits, receipts..."
                className="pl-12 h-12 rounded-2xl bg-white border-none shadow-sm font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="space-y-0 divide-y divide-slate-50">
            {loading ? (
              <p className="p-12 text-center text-slate-400 font-bold animate-pulse">
                Loading repository index...
              </p>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-11 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-all shadow-sm">
                      <FileText className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 leading-tight">
                        {doc.document_name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-1">
                        ID: {doc.id.slice(0, 8)} •{" "}
                        <span className="text-blue-500">
                          {doc.document_type ||
                            "General Data"}
                        </span>{" "}
                        •{" "}
                        {doc.created_at
                          ? new Date(
                              doc.created_at,
                            ).toLocaleDateString(
                              "en-PH",
                            )
                          : "Unknown Date"}
                        {doc.file_size
                          ? ` • ${formatFileSize(doc.file_size)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${doc.status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                    >
                      {doc.status || "Pending"}
                    </span>
                    {doc.file_url ? (
                      <Button
                        onClick={() =>
                          handleDownload(doc)
                        }
                        variant="ghost"
                        className="h-10 px-4 font-black text-xs text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl"
                      >
                        <Download className="h-4 w-4 mr-2" />{" "}
                        Download
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold px-4">
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
