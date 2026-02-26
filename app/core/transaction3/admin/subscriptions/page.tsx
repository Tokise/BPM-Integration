"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function SubscriptionsPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("subscriptions_commissions")
      .select("*");

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const activeSubscribers = plans.length; // Simplified for now

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Subscriptions
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage platform membership plans
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0 flex flex-row items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-black">
              Plan Management
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-6">
            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-400 font-bold uppercase text-[10px]">
                  Loading plans...
                </p>
              ) : plans.length > 0 ? (
                plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
                  >
                    <div>
                      <p className="font-black text-slate-900 uppercase text-xs">
                        {plan.plan_type}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        Rate:{" "}
                        {plan.commission_rate}%
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase">
                      {plan.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 font-medium">
                  Create and modify subscription
                  tiers for sellers.
                </p>
              )}
            </div>
            <Button className="mt-6 bg-slate-900 text-white font-black rounded-xl w-full">
              Manage Plans
            </Button>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0 flex flex-row items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-xl font-black">
              Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white mb-6">
              <p className="text-[10px] font-black uppercase text-slate-400">
                Total Active Shops
              </p>
              <p className="text-4xl font-black">
                {activeSubscribers}
              </p>
            </div>
            <p className="text-slate-500 font-medium">
              Monitor active memberships and
              renewals across the platform.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-xl w-full font-bold border-slate-200 text-black"
            >
              View Detailed List
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
