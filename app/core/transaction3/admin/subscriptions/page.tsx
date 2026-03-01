"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Zap,
  Users,
  Shield,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";

interface SubscriptionPlan {
  id: string;
  shop_id: string | null;
  plan_type: string;
  commission_rate: number;
  status: string;
}

interface Policy {
  id: string;
  type: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SubscriptionsPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const [plans, setPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [policies, setPolicies] = useState<
    Policy[]
  >([]);
  const [loadingPlans, setLoadingPlans] =
    useState(true);
  const [loadingPolicies, setLoadingPolicies] =
    useState(true);

  // Plan dialog state
  const [planDialogOpen, setPlanDialogOpen] =
    useState(false);
  const [editingPlan, setEditingPlan] =
    useState<SubscriptionPlan | null>(null);
  const [planType, setPlanType] = useState("");
  const [commissionRate, setCommissionRate] =
    useState("");
  const [planStatus, setPlanStatus] =
    useState("active");
  const [savingPlan, setSavingPlan] =
    useState(false);

  // Policy dialog state
  const [policyDialogOpen, setPolicyDialogOpen] =
    useState(false);
  const [editingPolicy, setEditingPolicy] =
    useState<Policy | null>(null);
  const [policyTitle, setPolicyTitle] =
    useState("");
  const [
    policyDescription,
    setPolicyDescription,
  ] = useState("");
  const [savingPolicy, setSavingPolicy] =
    useState(false);

  const fetchSubscriptions =
    useCallback(async () => {
      setLoadingPlans(true);
      const { data } = await supabase
        .from("subscriptions_commissions")
        .select("*")
        .order("plan_type", { ascending: true });
      if (data) setPlans(data);
      setLoadingPlans(false);
    }, [supabase]);

  const fetchPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    const { data } = await supabase
      .from("platform_policies")
      .select("*")
      .eq("type", "subscription")
      .order("created_at", { ascending: false });
    if (data) setPolicies(data);
    setLoadingPolicies(false);
  }, [supabase]);

  useEffect(() => {
    fetchSubscriptions();
    fetchPolicies();
  }, [fetchSubscriptions, fetchPolicies]);

  // === Plan CRUD ===
  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanType("");
    setCommissionRate("");
    setPlanStatus("active");
    setPlanDialogOpen(true);
  };

  const openEditPlan = (
    plan: SubscriptionPlan,
  ) => {
    setEditingPlan(plan);
    setPlanType(plan.plan_type);
    setCommissionRate(
      String(plan.commission_rate),
    );
    setPlanStatus(plan.status);
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (
      !planType.trim() ||
      !commissionRate.trim()
    ) {
      toast.error(
        "Plan type and commission rate are required",
      );
      return;
    }
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(
        "Commission rate must be 0-100",
      );
      return;
    }
    setSavingPlan(true);
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from("subscriptions_commissions")
          .update({
            plan_type: planType.trim(),
            commission_rate: rate,
            status: planStatus,
          })
          .eq("id", editingPlan.id);
        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: profile?.id,
          action: "subscription_plan_updated",
          entity_type: "subscription_plan",
          entity_id: editingPlan.id,
          details: {
            plan_type: planType.trim(),
            commission_rate: rate,
            status: planStatus,
          },
        });
        toast.success(
          "Subscription plan updated",
        );
      } else {
        const { data, error } = await supabase
          .from("subscriptions_commissions")
          .insert({
            plan_type: planType.trim(),
            commission_rate: rate,
            status: planStatus,
          })
          .select()
          .single();
        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: profile?.id,
          action: "subscription_plan_created",
          entity_type: "subscription_plan",
          entity_id: data.id,
          details: {
            plan_type: planType.trim(),
            commission_rate: rate,
          },
        });
        toast.success(
          "Subscription plan created",
        );
      }
      setPlanDialogOpen(false);
      fetchSubscriptions();
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (
    plan: SubscriptionPlan,
  ) => {
    const { error } = await supabase
      .from("subscriptions_commissions")
      .delete()
      .eq("id", plan.id);
    if (error) {
      toast.error("Failed to delete plan");
    } else {
      await supabase.from("audit_logs").insert({
        user_id: profile?.id,
        action: "subscription_plan_deleted",
        entity_type: "subscription_plan",
        entity_id: plan.id,
        details: { plan_type: plan.plan_type },
      });
      toast.success("Plan deleted");
      fetchSubscriptions();
    }
  };

  // === Policy CRUD ===
  const openCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyTitle("");
    setPolicyDescription("");
    setPolicyDialogOpen(true);
  };

  const openEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setPolicyTitle(policy.title);
    setPolicyDescription(
      policy.description || "",
    );
    setPolicyDialogOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!policyTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSavingPolicy(true);
    try {
      if (editingPolicy) {
        const { error } = await supabase
          .from("platform_policies")
          .update({
            title: policyTitle.trim(),
            description: policyDescription.trim(),
          })
          .eq("id", editingPolicy.id);
        if (error) throw error;
        await supabase.from("audit_logs").insert({
          user_id: profile?.id,
          action: "policy_updated",
          entity_type: "policy",
          entity_id: editingPolicy.id,
          details: {
            type: "subscription",
            title: policyTitle.trim(),
          },
        });
        toast.success("Policy updated");
      } else {
        const { data, error } = await supabase
          .from("platform_policies")
          .insert({
            type: "subscription",
            title: policyTitle.trim(),
            description: policyDescription.trim(),
            created_by: profile?.id,
          })
          .select()
          .single();
        if (error) throw error;
        await supabase.from("audit_logs").insert({
          user_id: profile?.id,
          action: "policy_created",
          entity_type: "policy",
          entity_id: data.id,
          details: {
            type: "subscription",
            title: policyTitle.trim(),
          },
        });
        toast.success("Policy created");
      }
      setPolicyDialogOpen(false);
      fetchPolicies();
    } catch {
      toast.error("Failed to save policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const togglePolicy = async (policy: Policy) => {
    const { error } = await supabase
      .from("platform_policies")
      .update({ is_active: !policy.is_active })
      .eq("id", policy.id);
    if (error) toast.error("Failed to toggle");
    else {
      toast.success(
        `Policy ${!policy.is_active ? "enabled" : "disabled"}`,
      );
      fetchPolicies();
    }
  };

  const deletePolicy = async (policy: Policy) => {
    const { error } = await supabase
      .from("platform_policies")
      .delete()
      .eq("id", policy.id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Policy deleted");
      fetchPolicies();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-black">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
          Subscriptions
        </h1>
        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
          Manage platform membership plans &amp;
          policies
        </p>
      </div>

      {/* ===== PLAN MANAGEMENT ===== */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Subscription Plans
          </CardTitle>
          <Button
            onClick={openCreatePlan}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-9 px-4 text-xs shadow-lg shadow-amber-100"
          >
            <Plus className="h-4 w-4 mr-1" /> New
            Plan
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPlans ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px]">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="p-12 text-center">
              <Zap className="h-12 w-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold italic">
                No subscription plans yet. Create
                one above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase text-sm">
                        {plan.plan_type}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Percent className="h-3 w-3" />{" "}
                        Commission:{" "}
                        {plan.commission_rate}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                        plan.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {plan.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openEditPlan(plan)
                      }
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deletePlan(plan)
                      }
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== SUBSCRIPTION POLICIES ===== */}
      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Subscription Policies
          </CardTitle>
          <Button
            onClick={openCreatePolicy}
            className="bg-slate-900 hover:bg-black text-white font-black rounded-xl h-9 px-4 text-xs"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
            Policy
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPolicies ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px]">
              Loading policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold italic">
                No subscription policies yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-slate-900">
                        {policy.title}
                      </h3>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          policy.is_active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {policy.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                    {policy.description && (
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        {policy.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        togglePolicy(policy)
                      }
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
                    >
                      {policy.is_active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openEditPolicy(policy)
                      }
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deletePolicy(policy)
                      }
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Dialog */}
      <Dialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] rounded-[40px] border-none shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">
              {editingPlan
                ? "Edit Plan"
                : "New Subscription Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Plan Name
              </Label>
              <Input
                placeholder="e.g. Basic, Premium, Enterprise"
                value={planType}
                onChange={(e) =>
                  setPlanType(e.target.value)
                }
                className="rounded-2xl border-slate-100 h-12 font-bold focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Commission Rate (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 5.0"
                value={commissionRate}
                onChange={(e) =>
                  setCommissionRate(
                    e.target.value,
                  )
                }
                className="rounded-2xl border-slate-100 h-12 font-bold focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Status
              </Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={
                    planStatus === "active"
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setPlanStatus("active")
                  }
                  className={`rounded-xl flex-1 h-12 font-black ${
                    planStatus === "active"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "border-slate-200 text-black"
                  }`}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={
                    planStatus === "inactive"
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setPlanStatus("inactive")
                  }
                  className={`rounded-xl flex-1 h-12 font-black ${
                    planStatus === "inactive"
                      ? "bg-slate-500 hover:bg-slate-600 text-white"
                      : "border-slate-200 text-black"
                  }`}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl h-14 text-lg shadow-xl shadow-amber-100"
            >
              {savingPlan
                ? "Saving..."
                : editingPlan
                  ? "Update Plan"
                  : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog
        open={policyDialogOpen}
        onOpenChange={setPolicyDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] rounded-[40px] border-none shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">
              {editingPolicy
                ? "Edit Policy"
                : "New Subscription Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Title
              </Label>
              <Input
                placeholder="e.g. Renewal Grace Period"
                value={policyTitle}
                onChange={(e) =>
                  setPolicyTitle(e.target.value)
                }
                className="rounded-2xl border-slate-100 h-12 font-bold focus-visible:ring-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Description
              </Label>
              <textarea
                placeholder="Describe the policy..."
                value={policyDescription}
                onChange={(e) =>
                  setPolicyDescription(
                    e.target.value,
                  )
                }
                rows={4}
                className="w-full rounded-2xl border border-slate-100 p-4 font-medium text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-14 text-lg"
            >
              {savingPolicy
                ? "Saving..."
                : editingPolicy
                  ? "Update Policy"
                  : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
