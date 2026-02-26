"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Truck,
  Phone,
  Settings2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Provider {
  id: string;
  name: string;
  contact_number: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export default function LogisticsConfigPage() {
  const [providers, setProviders] = useState<
    Provider[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] =
    useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const supabase = createClient();

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("logistics_providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch providers");
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleAddProvider = async () => {
    if (!newName) return;
    const { error } = await supabase
      .from("logistics_providers")
      .insert([
        {
          name: newName,
          contact_number: newPhone,
        },
      ]);

    if (error) {
      toast.error("Failed to add provider");
    } else {
      toast.success(
        "Provider added successfully",
      );
      setIsAddOpen(false);
      setNewName("");
      setNewPhone("");
      fetchProviders();
    }
  };

  const handleToggleActive = async (
    id: string,
    current: boolean,
  ) => {
    const { error } = await supabase
      .from("logistics_providers")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast.error("Update failed");
    } else {
      fetchProviders();
    }
  };

  const handleSetDefault = async (id: string) => {
    // First remove default from all
    await supabase
      .from("logistics_providers")
      .update({ is_default: false })
      .neq("id", id);

    // Set new default
    const { error } = await supabase
      .from("logistics_providers")
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      toast.error("Failed to set default");
    } else {
      toast.success("Default provider updated");
      fetchProviders();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("logistics_providers")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Provider removed");
      fetchProviders();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Logistics Config
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage couriers and platform shipping
            defaults
          </p>
        </div>

        <Dialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-black text-white font-black rounded-xl h-12 shadow-lg shadow-slate-200 px-6 gap-2">
              <Plus className="h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter">
                Add Courier
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-400">
                Register a new logistics partner
                for the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
                >
                  Courier Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. J&T Express"
                  value={newName}
                  onChange={(e) =>
                    setNewName(e.target.value)
                  }
                  className="rounded-xl border-slate-100 h-12 font-bold focus-visible:ring-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
                >
                  Contact Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+63 ..."
                  value={newPhone}
                  onChange={(e) =>
                    setNewPhone(e.target.value)
                  }
                  className="rounded-xl border-slate-100 h-12 font-bold focus-visible:ring-slate-900"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddProvider}
                className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-xl h-12"
              >
                Save Provider
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 h-48 animate-pulse bg-white"
            />
          ))
        ) : providers.length === 0 ? (
          <Card className="col-span-full border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white p-12 text-center flex flex-col items-center">
            <Truck className="h-16 w-16 text-slate-100 mb-6" />
            <h3 className="text-xl font-black text-slate-900">
              No Providers Found
            </h3>
            <p className="text-slate-500 font-bold mt-2">
              Start by adding a logistics partner.
            </p>
          </Card>
        ) : (
          providers.map((provider) => (
            <Card
              key={provider.id}
              className={`border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden ${provider.is_default ? "ring-2 ring-amber-500" : ""}`}
            >
              {provider.is_default && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-widest">
                  Platform Default
                </div>
              )}

              <CardHeader className="p-8 pb-4">
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                  <Truck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight">
                  {provider.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-6">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                  <Phone className="h-4 w-4" />
                  {provider.contact_number ||
                    "No contact info"}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={
                          provider.is_active
                        }
                        onCheckedChange={() =>
                          handleToggleActive(
                            provider.id,
                            provider.is_active,
                          )
                        }
                      />
                      <span
                        className={`text-[10px] font-black uppercase ${provider.is_active ? "text-emerald-500" : "text-slate-300"}`}
                      >
                        {provider.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!provider.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSetDefault(
                            provider.id,
                          )
                        }
                        className="rounded-lg h-8 text-[10px] font-black uppercase border-slate-100 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDelete(provider.id)
                      }
                      className="rounded-lg h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
