"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  FileText,
  Scale,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function PoliciesPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("document_tracking")
      .select("*")
      .limit(5);

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-black">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Catalogue Policy
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Enforce platform rules and standards
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-slate-900 text-white">
          <Shield className="h-8 w-8 text-amber-500 mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">
            Active Rules
          </p>
          <p className="text-3xl font-black">
            24 Active
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <Scale className="h-8 w-8 text-blue-500 mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">
            Governance
          </p>
          <p className="text-3xl font-black text-slate-900">
            High
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">
            Violations
          </p>
          <p className="text-3xl font-black text-slate-900">
            0 Items
          </p>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12">
        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-slate-400" />
          Recent Governance Audit Logs
        </h3>
        <div className="space-y-4">
          {loading ? (
            <p className="text-slate-400 font-bold uppercase text-[10px]">
              Fetching audit trails...
            </p>
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {log.doc_type ||
                      "Policy Check"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    Status: {log.status}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-black">
                  {log.current_location ||
                    "System"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 font-bold">
              No recent governance logs found.
            </p>
          )}
        </div>
        <Button className="mt-8 bg-slate-900 text-white font-black rounded-xl h-11 px-8 w-full md:w-auto">
          View Full Audit
        </Button>
      </Card>
    </div>
  );
}
