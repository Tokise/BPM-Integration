"use client";

import { useEffect, useState } from "react";
import {
  WalletCards,
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  Users,
  AlertCircle,
  FileText,
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
import { approveClaim } from "@/app/actions/hr_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ClaimsManagementPage() {
  const supabase = createClient();
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [newClaim, setNewClaim] = useState({
    employee_name: "",
    claim_type: "Travel",
    amount: 0,
    status: "pending",
    description: "",
  });

  useEffect(() => {
    fetchClaims();

    const channel = supabase
      .channel("claims_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "bpm-anec-global",
          table: "claims_reimbursement",
        },
        fetchClaims,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    const { data } = await supabase
      .schema("bpm-anec-global")
      .from("claims_reimbursement")
      .select(
        `
        *,
        profiles (
          full_name
        )
      `,
      )
      .order("created_at", { ascending: false });

    setClaims(data || []);
    setLoading(false);
  };

  const handleApprove = async (
    id: string,
    employeeId: string,
    amount: number,
  ) => {
    toast.promise(
      approveClaim(id, employeeId, amount),
      {
        loading:
          "Approving claim & creating AP entry...",
        success:
          "Claim approved and sent to Finance",
        error: "Failed to approve claim",
      },
    );
    fetchClaims();
  };

  const handleAddClaim = async () => {
    if (
      !newClaim.employee_name ||
      newClaim.amount <= 0
    )
      return toast.error(
        "Please provide name and valid amount",
      );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("claims_reimbursement")
      .insert([newClaim]);

    if (error) {
      toast.error("Failed to submit claim");
    } else {
      toast.success(
        "Reimbursement claim submitted",
      );
      setIsModalOpen(false);
      setNewClaim({
        employee_name: "",
        claim_type: "Travel",
        amount: 0,
        status: "pending",
        description: "",
      });
      fetchClaims();
    }
  };

  const filteredClaims = claims.filter(
    (c) =>
      c.employee_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      c.profiles?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      c.claim_type
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() =>
                router.push("/hr/dept3")
              }
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
            >
              <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400">
                <ChevronLeft className="h-3 w-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                Back to Dashboard
              </span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Expense Claims
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Employee reimbursements & Finance
              integration
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20">
                <Plus className="h-4 w-4 mr-2" />{" "}
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Expense Claim
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="employee"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Employee Name
                  </Label>
                  <Input
                    id="employee"
                    value={newClaim.employee_name}
                    onChange={(e) =>
                      setNewClaim({
                        ...newClaim,
                        employee_name:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. Sarah Jenkins"
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="amount"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newClaim.amount}
                      onChange={(e) =>
                        setNewClaim({
                          ...newClaim,
                          amount: Number(
                            e.target.value,
                          ),
                        })
                      }
                      className="rounded-xl border-slate-100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="type"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Type
                    </Label>
                    <select
                      id="type"
                      value={newClaim.claim_type}
                      onChange={(e) =>
                        setNewClaim({
                          ...newClaim,
                          claim_type:
                            e.target.value,
                        })
                      }
                      className="flex h-11 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm"
                    >
                      <option>Travel</option>
                      <option>Medical</option>
                      <option>Equipment</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="desc"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Description
                  </Label>
                  <Input
                    id="desc"
                    value={newClaim.description}
                    onChange={(e) =>
                      setNewClaim({
                        ...newClaim,
                        description:
                          e.target.value,
                      })
                    }
                    placeholder="Purpose of expense..."
                    className="rounded-xl border-slate-100"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddClaim}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl h-11"
              >
                Submit Claim
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            placeholder="Search employees or claim types..."
            className="pl-11 h-12 bg-white border-none shadow-xl shadow-slate-100/50 rounded-2xl focus-visible:ring-blue-500 font-medium"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-100/50 overflow-hidden border border-slate-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Employee
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Category
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Amount
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-8 py-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3].map((i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-50"
                    >
                      <td
                        colSpan={5}
                        className="h-20 px-8 py-6 bg-white/50"
                      />
                    </tr>
                  ))
                : filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            {(
                              claim.profiles
                                ?.full_name ||
                              claim.employee_name ||
                              "?"
                            ).charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">
                              {claim.profiles
                                ?.full_name ||
                                claim.employee_name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              Ref:{" "}
                              {claim.id.slice(
                                0,
                                8,
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">
                            {claim.claim_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900">
                          ₱
                          {claim.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            claim.status ===
                            "approved"
                              ? "bg-emerald-50 text-emerald-600"
                              : claim.status ===
                                  "rejected"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600 animate-pulse"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {claim.status ===
                            "pending" && (
                            <Button
                              onClick={() =>
                                handleApprove(
                                  claim.id,
                                  claim.employee_id ||
                                    claim.employee_name,
                                  claim.amount,
                                )
                              }
                              className="h-8 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800"
                            >
                              Approve & Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filteredClaims.length === 0 &&
            !loading && (
              <div className="p-32 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                  <WalletCards className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  No Claims
                </h3>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
