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
  Banknote,
  Navigation,
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
import { approveClaim } from "@/app/actions/hr_finance_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PrivacyMask } from "@/components/ui/privacy-mask";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr/dept3">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              Expense Claims
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Expense Claims
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Reimbursements & Finance Integration
          </p>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-12 px-8 shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px] flex items-center gap-3">
              <Plus className="h-4 w-4" /> New
              Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tighter">
                  Claim Request
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="employee"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Employee
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
                    className="h-14 rounded-2xl border-none bg-slate-50 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="amount"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Amount (₱)
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
                      className="h-14 rounded-2xl border-none bg-slate-50 font-bold"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="type"
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Category
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
                      className="flex h-14 w-full rounded-2xl border-none bg-slate-50 px-3 py-2 font-bold text-sm focus:outline-none"
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
                    Context/Reason
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
                    placeholder="Brief description..."
                    className="h-14 rounded-2xl border-none bg-slate-50 font-bold"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddClaim}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px]"
              >
                Submit for Audit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <Input
          placeholder="Filter by name or category..."
          className="pl-11 h-14 bg-white border-none shadow-2xl shadow-slate-100 rounded-2xl focus-visible:ring-indigo-500 font-medium"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
        />
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-100 overflow-hidden border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Personnel
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Classification
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Gross Amount
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Audit Status
                </th>
                <th className="px-8 py-6 text-right"></th>
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
                        className="h-24 px-8 py-6 bg-white"
                      />
                    </tr>
                  ))
                : filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black italic">
                            {(
                              claim.profiles
                                ?.full_name ||
                              claim.employee_name ||
                              "?"
                            ).charAt(0)}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block tracking-tight">
                              <PrivacyMask
                                value={
                                  claim.profiles
                                    ?.full_name ||
                                  claim.employee_name
                                }
                              />
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                              ID:{" "}
                              {claim.id.slice(
                                0,
                                8,
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-300" />
                          <span className="text-xs font-black text-slate-600 tracking-tight">
                            {claim.claim_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 italic tracking-tighter">
                          ₱
                          <PrivacyMask
                            value={claim.amount.toLocaleString()}
                          />
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
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
                          "pending" ? (
                            <Button
                              onClick={() =>
                                handleApprove(
                                  claim.id,
                                  claim.employee_id ||
                                    claim.employee_name,
                                  claim.amount,
                                )
                              }
                              className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-100"
                            >
                              Approve & Pay
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl text-slate-300 hover:bg-slate-50"
                            >
                              <CheckCircle2 className="h-5 w-5" />
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
                  <Banknote className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 italic">
                  No Claims Audited
                </h3>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
