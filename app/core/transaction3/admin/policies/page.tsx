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
  Shield,
  FileText,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  X,
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

interface Policy {
  id: string;
  type: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export default function PoliciesPage() {
  const supabase = createClient();
  const { profile } = useUser();
  const [policies, setPolicies] = useState<
    Policy[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] =
    useState(false);
  const [editingPolicy, setEditingPolicy] =
    useState<Policy | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [saving, setSaving] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_policies")
      .select("*")
      .eq("type", "catalogue")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPolicies(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const openCreate = () => {
    setEditingPolicy(null);
    setTitle("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setTitle(policy.title);
    setDescription(policy.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    try {
      if (editingPolicy) {
        const { error } = await supabase
          .schema("bpm-anec-global")
          .from("platform_policies")
          .update({
            title: title.trim(),
            description: description.trim(),
          })
          .eq("id", editingPolicy.id);
        if (error) throw error;

        await supabase
          .schema("bpm-anec-global")
          .from("audit_logs")
          .insert({
            user_id: profile?.id,
            action: "policy_updated",
            entity_type: "policy",
            entity_id: editingPolicy.id,
            details: {
              type: "catalogue",
              title: title.trim(),
            },
          });

        toast.success("Policy updated");
      } else {
        const { data, error } = await supabase
          .schema("bpm-anec-global")
          .from("platform_policies")
          .insert({
            type: "catalogue",
            title: title.trim(),
            description: description.trim(),
            created_by: profile?.id,
          })
          .select()
          .single();
        if (error) throw error;

        await supabase
          .schema("bpm-anec-global")
          .from("audit_logs")
          .insert({
            user_id: profile?.id,
            action: "policy_created",
            entity_type: "policy",
            entity_id: data.id,
            details: {
              type: "catalogue",
              title: title.trim(),
            },
          });

        toast.success("Policy created");
      }
      setDialogOpen(false);
      fetchPolicies();
    } catch {
      toast.error("Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const togglePolicy = async (policy: Policy) => {
    const { error } = await supabase
      .from("platform_policies")
      .update({ is_active: !policy.is_active })
      .eq("id", policy.id);

    if (error) {
      toast.error("Failed to toggle policy");
    } else {
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

    if (error) {
      toast.error("Failed to delete policy");
    } else {
      toast.success("Policy deleted");
      fetchPolicies();
    }
  };

  const activeCount = policies.filter(
    (p) => p.is_active,
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Catalogue Policy
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage product listing rules &amp;
            standards
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-slate-900 hover:bg-black text-white font-black rounded-xl h-12 px-6 shadow-lg shadow-slate-200"
        >
          <Plus className="h-5 w-5 mr-2" /> New
          Policy
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-slate-900 text-white">
          <Shield className="h-8 w-8 text-amber-500 mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">
            Active Rules
          </p>
          <p className="text-3xl font-black">
            {activeCount}
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <FileText className="h-8 w-8 text-blue-500 mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">
            Total Policies
          </p>
          <p className="text-3xl font-black text-slate-900">
            {policies.length}
          </p>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <ToggleRight className="h-8 w-8 text-emerald-500 mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">
            Inactive
          </p>
          <p className="text-3xl font-black text-slate-900">
            {policies.length - activeCount}
          </p>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-xl font-black">
            All Catalogue Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px]">
              Loading policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold italic">
                No catalogue policies yet. Create
                one above.
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
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      Created{" "}
                      {new Date(
                        policy.created_at,
                      ).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
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
                        openEdit(policy)
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

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] rounded-[40px] border-none shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">
              {editingPolicy
                ? "Edit Policy"
                : "New Catalogue Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Title
              </Label>
              <Input
                placeholder="e.g. Prohibited Items Policy"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                className="rounded-2xl border-slate-100 h-12 font-bold focus-visible:ring-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Description
              </Label>
              <textarea
                placeholder="Describe the policy rules..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={4}
                className="w-full rounded-2xl border border-slate-100 p-4 font-medium text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-14 text-lg"
            >
              {saving
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
