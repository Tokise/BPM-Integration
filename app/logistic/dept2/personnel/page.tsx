"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Phone,
  MapPin,
  Star,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PersonnelPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Delivery Personnel
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor active drivers and delivery
            staff performance.
          </p>
        </div>
        <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4 mr-2" />{" "}
          Add Driver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card
            key={i}
            className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group"
          >
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    DP
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">
                      Driver Name {i}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Employee-ID-{i}02
                    </p>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase">
                  Online
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Active in Makati Area
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  4.9 Rating (128 Deliveries)
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-slate-100 font-bold hover:bg-slate-50"
                >
                  View Stats
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <Phone className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
