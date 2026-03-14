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
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
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
  const { profile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userDeptCode = (profile?.departments as any)?.code;
  const isDept1 = pathname.startsWith("/hr/dept1");
  const isDept2 = pathname.startsWith("/hr/dept2");
  const baseUrl = isDept1 ? "/hr/dept1" : isDept2 ? "/hr/dept2" : "/hr/dept3";
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
    let query = supabase
      .schema("bpm-anec-global")
      .from("claims_reimbursement")
      .select(
        `
        *,
        profiles (
          full_name
        )
      `,
      );

    if (
      profile?.role === "employee" ||
      profile?.role === "hr3_employee" ||
      isDept1 ||
      isDept2
    ) {
      query = query.eq("employee_id", profile?.id);
    }

    const { data } = await query.order("created_at", {
      ascending: false,
    });

    setClaims(data || []);
    setLoading(false);
  };

  const handleApprove = async (
    id: string,
    employeeId: string,
    amount: number,
  ) => {
    if (profile?.role !== "hr3_admin") {
      return toast.error("Unauthorized");
    }
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
      !newClaim.employee_name &&
      profile?.role === "hr3_admin"
    )
      return toast.error(
        "Employee name is required",
      );

    if (newClaim.amount <= 0)
      return toast.error("Provide a valid amount");

    const submission = {
      ...newClaim,
      employee_id: profile?.id,
      employee_name:
        profile?.role === "employee"
          ? profile?.full_name
          : newClaim.employee_name,
    };

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("claims_reimbursement")
      .insert([submission]);

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
            <BreadcrumbLink
              asChild
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <Link href={baseUrl}>
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest">
              Expense Claims
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Expense Claims
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Reimbursements & Finance Integration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Filter by name or category..."
              className="pl-11 h-10 bg-white border border-slate-200 rounded-lg focus-visible:ring-slate-900 font-medium text-xs shadow-none"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-lg h-10 px-6 shadow-none uppercase tracking-widest text-[10px] flex items-center gap-3">
                <Plus className="h-4 w-4" /> New
                Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-lg border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
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
                      value={
                        newClaim.employee_name
                      }
                      onChange={(e) =>
                        setNewClaim({
                          ...newClaim,
                          employee_name:
                            e.target.value,
                        })
                      }
                      placeholder="e.g. Sarah Jenkins"
                      className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold"
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
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
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
                        value={
                          newClaim.claim_type
                        }
                        onChange={(e) =>
                          setNewClaim({
                            ...newClaim,
                            claim_type:
                              e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-xs focus:outline-none"
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
                      className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddClaim}
                  className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-none uppercase tracking-widest text-[10px]"
                >
                  Submit for Audit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
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
                          <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center font-black border border-slate-100">
                            {(
                              claim.profiles
                                ?.full_name ||
                              claim.employee_name ||
                              "?"
                            ).charAt(0)}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block tracking-tighter">
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
                          <span className="text-xs font-black text-slate-600 tracking-tighter">
                            {claim.claim_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">
                          ₱
                          <PrivacyMask
                            value={claim.amount.toLocaleString()}
                          />
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-none ${
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
                            !isDept1 ? (
                            <Button
                              onClick={() =>
                                handleApprove(
                                  claim.id,
                                  claim.employee_id ||
                                    claim.employee_name,
                                  claim.amount,
                                )
                              }
                              className="h-9 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest"
                            >
                              Approve & Pay
                            </Button>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                Awaiting Admin
                              </span>
                            )
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-lg text-slate-300 hover:bg-slate-50"
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
              <div className="col-span-full p-24 text-center bg-white rounded-[32px] shadow-sm border border-slate-50 mt-8">
                <Banknote className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">
                  No current claims
                </p>
                <p className="text-slate-400 text-xs mt-3 font-medium">
                  Financial reimbursements and claims will appear here once
                  submitted.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
