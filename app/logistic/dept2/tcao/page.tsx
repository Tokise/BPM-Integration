"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  DollarSign,
  PieChart,
  LineChart,
  BarChart,
  Activity,
  Box,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function TCAOPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalCost: 0,
    shipmentCount: 0,
    costPerShipment: 0,
    fleetEfficiency: 0,
    fuelExpenses: 0,
    maintenanceExpenses: 0,
    driverAllocation: 0,
    savings: 0,
  });

  const [recentTrips, setRecentTrips] = useState<
    any[]
  >([]);

  // Log Expense State
  const [isExpenseOpen, setIsExpenseOpen] =
    useState(false);
  const [expenseType, setExpenseType] = useState(
    "logistics_fuel",
  );
  const [expenseAmount, setExpenseAmount] =
    useState("");
  const [
    expenseDescription,
    setExpenseDescription,
  ] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [
      ledgerRes,
      reservationsRes,
      shipmentsRes,
    ] = await Promise.all([
      supabase
        .schema("bpm-anec-global")
        .from("financial_ledger")
        .select("amount, transaction_type")
        .in("transaction_type", [
          "logistics_fuel",
          "logistics_maintenance",
          "logistics_driver_allocation",
        ]),
      supabase
        .schema("bpm-anec-global")
        .from("vehicle_reservations")
        .select(
          "status, reservation_date, purpose, id",
        )
        .order("reservation_date", {
          ascending: false,
        }),
      supabase
        .schema("bpm-anec-global")
        .from("shipments")
        .select("id, status"),
    ]);

    const ledger = ledgerRes.data || [];
    const reservations =
      reservationsRes.data || [];
    const shipments = shipmentsRes.data || [];

    let fuel = 0;
    let main = 0;
    let driver = 0;

    ledger.forEach((item) => {
      const amt = Number(item.amount || 0);
      if (
        item.transaction_type === "logistics_fuel"
      )
        fuel += amt;
      if (
        item.transaction_type ===
        "logistics_maintenance"
      )
        main += amt;
      if (
        item.transaction_type ===
        "logistics_driver_allocation"
      )
        driver += amt;
    });

    const totalCost = fuel + main + driver;
    const shipmentCount = Math.max(
      shipments.length,
      1,
    ); // Avoid div by zero

    const currentEfficiency =
      reservations.length > 0
        ? Math.min(
            Math.round(
              (reservations.filter(
                (r) => r.status === "confirmed",
              ).length /
                reservations.length) *
                100,
            ),
            100,
          )
        : 0;

    setStats({
      totalCost,
      shipmentCount,
      costPerShipment: totalCost / shipmentCount,
      fleetEfficiency: currentEfficiency,
      fuelExpenses: fuel,
      maintenanceExpenses: main,
      driverAllocation: driver,
      savings: totalCost * 0.12, // Simulate 12% route savings for now
    });

    setRecentTrips(reservations.slice(0, 5));
    setLoading(false);
  };

  const handleLogExpense = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (
      !expenseAmount ||
      isNaN(Number(expenseAmount)) ||
      Number(expenseAmount) <= 0
    ) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      "Logging expense...",
    );

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("financial_ledger")
      .insert({
        transaction_type: expenseType,
        amount: Number(expenseAmount),
        entity_id: null,
        reference_id: `LOG-EXP-${Date.now()}`,
        status: "completed",
        description:
          expenseDescription ||
          "Logistics Operation Expense",
      });

    setIsSubmitting(false);

    if (!error) {
      toast.success(
        "Expense logically tracked!",
        { id: toastId },
      );
      setIsExpenseOpen(false);
      setExpenseAmount("");
      setExpenseDescription("");
      fetchData();
    } else {
      toast.error("Failed to log expense", {
        id: toastId,
        description: error.message,
      });
    }
  };

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Cost Analysis (TCAO)
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            Optimize transportation costs &
            predictive fleet analytics
          </p>
        </div>
        <Dialog
          open={isExpenseOpen}
          onOpenChange={setIsExpenseOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-black/10 hover:bg-slate-800 hover:scale-[1.02] transition-transform">
              <Plus className="h-4 w-4 mr-2" />{" "}
              Log Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] p-8 bg-white border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                Record Logistics Expense
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Track fleet maintenance, fuel, and
                driver costs
              </p>
            </DialogHeader>
            <form
              onSubmit={handleLogExpense}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Expense Category
                </label>
                <select
                  value={expenseType}
                  onChange={(e) =>
                    setExpenseType(e.target.value)
                  }
                  className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold px-4"
                >
                  <option value="logistics_fuel">
                    Fuel & Routing
                  </option>
                  <option value="logistics_maintenance">
                    Vehicle Maintenance
                  </option>
                  <option value="logistics_driver_allocation">
                    Driver Allocation / Stipend
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Amount (PHP)
                </label>
                <Input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) =>
                    setExpenseAmount(
                      e.target.value,
                    )
                  }
                  placeholder="0.00"
                  className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Reference / Description
                  (Optional)
                </label>
                <Input
                  value={expenseDescription}
                  onChange={(e) =>
                    setExpenseDescription(
                      e.target.value,
                    )
                  }
                  placeholder="e.g. Gas Refill MNL-CEB truck"
                  className="h-12 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 mt-4"
              >
                {isSubmitting
                  ? "Logging..."
                  : "Commit Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Avg Cost / Shipment",
            val: loading
              ? "..."
              : fmtCurrency(
                  stats.costPerShipment,
                ),
            icon: DollarSign,
            tr: "down",
            change: "-8%",
            color: "blue",
          },
          {
            label: "Fleet Efficiency",
            val: loading
              ? "..."
              : `${stats.fleetEfficiency}%`,
            icon: Activity,
            tr: "up",
            change: "+12%",
            color: "emerald",
          },
          {
            label: "Total Operations",
            val: loading
              ? "..."
              : fmtCurrency(stats.totalCost),
            icon: Calculator,
            tr: "up",
            change: "+2%",
            color: "amber",
          },
          {
            label: "Est. Route Savings",
            val: loading
              ? "..."
              : fmtCurrency(stats.savings),
            icon: TrendingDown,
            tr: "down",
            change: "-15%",
            color: "purple",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] overflow-hidden bg-white relative group"
          >
            <div
              className={`absolute -top-12 -right-12 h-32 w-32 bg-${stat.color}-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <CardContent className="p-8 flex flex-col gap-4 relative">
              <div className="flex items-start justify-between">
                <div
                  className={`h-12 w-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${stat.tr === "up" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                >
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                  {stat.val}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-slate-900 text-white overflow-hidden p-8 space-y-8 relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary blur-[100px] opacity-10 rounded-full pointer-events-none group-hover:opacity-20 transition-opacity" />
          <CardHeader className="p-0 relative">
            <CardTitle className="text-xl font-black">
              Logged Expense Distribution
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Live ledger aggregations
            </p>
          </CardHeader>
          <div className="space-y-6 relative">
            {[
              {
                label: "Fuel Consumption",
                pct: stats.totalCost
                  ? (stats.fuelExpenses /
                      stats.totalCost) *
                    100
                  : 0,
                color: "bg-amber-400",
                val: stats.fuelExpenses,
              },
              {
                label: "Vehicle Maintenance",
                pct: stats.totalCost
                  ? (stats.maintenanceExpenses /
                      stats.totalCost) *
                    100
                  : 0,
                color: "bg-blue-400",
                val: stats.maintenanceExpenses,
              },
              {
                label: "Driver Allocation",
                pct: stats.totalCost
                  ? (stats.driverAllocation /
                      stats.totalCost) *
                    100
                  : 0,
                color: "bg-emerald-400",
                val: stats.driverAllocation,
              },
            ].map((dist, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                    {dist.label}
                  </span>
                  <span className="text-sm font-black text-white">
                    {loading
                      ? "..."
                      : `${fmtCurrency(dist.val)} (${dist.pct.toFixed(1)}%)`}
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className={`h-full ${dist.color} ${loading ? "w-0" : `w-[${dist.pct}%]`}`}
                    style={{
                      width: loading
                        ? "0%"
                        : `${dist.pct}%`,
                      transition:
                        "width 1s ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[32px] bg-white overflow-hidden p-8 space-y-6">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-black text-slate-900">
              Trip Efficiency Log
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Recent dispatches
            </p>
          </CardHeader>
          <div className="space-y-0 divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
                Scanning routes...
              </div>
            ) : recentTrips.length > 0 ? (
              recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="py-4 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center ${trip.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                    >
                      <Box className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900 capitalize">
                        {trip.purpose ||
                          "General Transport"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Status:{" "}
                        <span
                          className={
                            trip.status ===
                            "confirmed"
                              ? "text-emerald-500"
                              : ""
                          }
                        >
                          {trip.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {trip.reservation_date
                        ? new Date(
                            trip.reservation_date,
                          ).toLocaleDateString(
                            "en-PH",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "TBA"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 font-bold text-center py-8">
                No trip data available to analyze.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
