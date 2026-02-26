"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  FileText,
  PieChart,
  LineChart,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function AdminReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("document_tracking")
      .select("*")
      .limit(6);

    if (data) setReports(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-black">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Reports & Admin
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Platform-wide reporting and oversight
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full p-20 text-center font-black text-slate-200 uppercase tracking-widest text-xl italic">
            Compiling Data...
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <Card
              key={report.id}
              className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white hover:translate-y-[-4px] transition-transform group"
            >
              <FileText className="h-10 w-10 text-slate-200 mb-4 group-hover:text-amber-500 transition-colors" />
              <h3 className="font-black text-lg text-slate-900">
                {report.doc_type ||
                  "System Audit"}
              </h3>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                Ref: #
                {report.id
                  .slice(0, 8)
                  .toUpperCase()}
              </p>
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {report.status || "Archived"}
                </span>
                <Button
                  variant="ghost"
                  className="h-8 px-3 rounded-lg text-amber-600 font-bold text-xs flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />{" "}
                  PDF
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 bg-white rounded-3xl text-center">
            <LayoutDashboard className="h-12 w-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              No reports generated yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
