"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Banknote,
  Fuel,
  CreditCard,
  History,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

export default function DisbursementPage() {
  const supabase = createClient();
  const [disbursements, setDisbursements] =
    useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisbursements();
  }, []);

  const fetchDisbursements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("disbursements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setDisbursements(data);
    }
    setLoading(false);
  };

  const totalAmount = disbursements.reduce(
    (acc, d) => acc + (d.amount || 0),
    0,
  );
  const pendingCount = disbursements.filter(
    (d) => d.status === "pending",
  ).length;

  return (
    <div className="space-y-8 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Fuel & Disbursement
          </h1>
          <p className="text-slate-500 font-medium">
            Manage fleet fuel allocations and
            driver expense reimbursements.
          </p>
        </div>
        <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> New
          Disbursement
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 border-b-4 border-amber-400">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Fuel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Resource Volume
              </p>
              <p className="text-2xl font-black text-slate-900">
                12,480L
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 border-b-4 border-green-400">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Disbursed
              </p>
              <p className="text-2xl font-black text-slate-900">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 border-b-4 border-blue-400">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Tickets Pending
              </p>
              <p className="text-2xl font-black text-slate-900">
                {pendingCount} Tickets
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search vouchers..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ticket ID
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Recipient
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Purpose
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Amount
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-slate-400 font-bold"
                    >
                      Loading disbursement logs...
                    </td>
                  </tr>
                ) : disbursements.length > 0 ? (
                  disbursements.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-6">
                        <div className="font-bold text-slate-900">
                          #
                          {d.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </div>
                      </td>
                      <td className="p-6 font-medium text-slate-700 capitalize">
                        {d.recipient_type ||
                          "Personnel"}{" "}
                        #{d.id.slice(0, 4)}
                      </td>
                      <td className="p-6 text-sm text-slate-500 capitalize">
                        {d.purpose ||
                          "General Logistics"}
                      </td>
                      <td className="p-6 font-black text-slate-900">
                        $
                        {d.amount?.toLocaleString()}
                      </td>
                      <td className="p-6 text-right">
                        <span
                          className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${d.status === "paid" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-20 text-center"
                    >
                      <Banknote className="h-12 w-12 text-slate-100 mx-auto mb-2" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        No disbursement tickets
                        found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
