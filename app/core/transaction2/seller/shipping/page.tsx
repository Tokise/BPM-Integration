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
  Truck,
  MapPin,
  Search,
  Package,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Provider {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
}

export default function ShippingIntegrationPage() {
  const supabase = createClient();
  const { shopId } = useUser();
  const [shipments, setShipments] = useState<
    any[]
  >([]);
  const [allProviders, setAllProviders] =
    useState<Provider[]>([]);
  const [enabledProviders, setEnabledProviders] =
    useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);

    // Fetch Shipments
    const { data: shipmentData } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .select(
        `*, orders!inner(shop_id, order_number)`,
      )
      .order("id", { ascending: false });

    if (shipmentData) setShipments(shipmentData);

    // Fetch All Active Providers
    const { data: providerData } = await supabase
      .from("logistics_providers")
      .select("*")
      .eq("is_active", true);

    if (providerData)
      setAllProviders(providerData);

    // Fetch Shop Settings
    const { data: settingData } = await supabase
      .from("shop_logistics_settings")
      .select("provider_id")
      .eq("shop_id", shopId)
      .eq("is_enabled", true);

    if (settingData) {
      setEnabledProviders(
        new Set(
          settingData.map((s) => s.provider_id),
        ),
      );
    }

    setLoading(false);
  }, [shopId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleProvider = async (
    providerId: string,
    currentlyEnabled: boolean,
  ) => {
    if (!shopId) return;

    if (currentlyEnabled) {
      // Disable
      const { error } = await supabase
        .from("shop_logistics_settings")
        .update({ is_enabled: false })
        .match({
          shop_id: shopId,
          provider_id: providerId,
        });

      if (!error) {
        setEnabledProviders((prev) => {
          const next = new Set(prev);
          next.delete(providerId);
          return next;
        });
        toast.info(
          "Courier disabled for your shop",
        );
      }
    } else {
      // Enable (UPSERT)
      const { error } = await supabase
        .from("shop_logistics_settings")
        .upsert({
          shop_id: shopId,
          provider_id: providerId,
          is_enabled: true,
        });

      if (!error) {
        setEnabledProviders(
          (prev) =>
            new Set([
              ...Array.from(prev),
              providerId,
            ]),
        );
        toast.success(
          "Courier enabled for your shop",
        );
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Shipping Integration
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage courier partners and shipments
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="couriers"
        className="space-y-8"
      >
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
          <TabsTrigger
            value="couriers"
            className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Couriers
          </TabsTrigger>
          <TabsTrigger
            value="shipments"
            className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Active Shipments
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="couriers"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProviders.map((provider) => {
              const isEnabled =
                enabledProviders.has(provider.id);
              return (
                <Card
                  key={provider.id}
                  className={`border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden ${isEnabled ? "ring-2 ring-blue-500" : ""}`}
                >
                  {provider.is_default && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-widest flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />{" "}
                      Platform Default
                    </div>
                  )}

                  <CardHeader className="p-8 pb-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                      <Truck className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight">
                      {provider.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-slate-500 font-bold text-xs leading-relaxed">
                      Enable this courier to offer{" "}
                      {provider.name} shipping to
                      your customers at checkout.
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Offer to Customers
                        </span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() =>
                              toggleProvider(
                                provider.id,
                                isEnabled,
                              )
                            }
                          />
                          <span
                            className={`text-[10px] font-black uppercase ${isEnabled ? "text-blue-500" : "text-slate-300"}`}
                          >
                            {isEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                      </div>
                      <CheckCircle2
                        className={`h-6 w-6 ${isEnabled ? "text-emerald-500" : "text-slate-100"}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="shipments">
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black">
                Active Shipments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                  Locating shipments...
                </div>
              ) : shipments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Shipment ID
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Order Ref
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {shipments.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-6 font-bold text-slate-900">
                            #
                            {s.id
                              .slice(0, 8)
                              .toUpperCase()}
                          </td>
                          <td className="p-6 text-sm text-slate-500 font-mono">
                            #
                            {s.orders
                              ?.order_number ||
                              "N/A"}
                          </td>
                          <td className="p-6">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-6 text-right font-black">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white rounded-lg"
                            >
                              Track
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center flex flex-col items-center">
                  <Truck className="h-16 w-16 text-slate-100 mb-6" />
                  <h3 className="text-xl font-black text-slate-900">
                    No active shipments
                  </h3>
                  <p className="text-slate-500 font-bold mt-2">
                    Ready to fulfill? Start
                    processing your orders.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
