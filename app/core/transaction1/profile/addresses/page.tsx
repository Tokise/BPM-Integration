"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Plus,
  Navigation,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function UserAddressesPage() {
  const { addresses, loading } = useUser();
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Location & Address
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Manage your shipping and delivery
            locations
          </p>
        </div>
        <Button 
          className="bg-slate-900 text-white font-black rounded-xl h-12 shadow-lg shadow-slate-200 px-6 flex items-center gap-2"
          onClick={() => router.push("/core/transaction1/profile?tab=address")}
        >
          <Plus className="h-5 w-5" /> Add Address
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <Navigation className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              No addresses saved
            </h3>
            <p className="text-slate-500 font-medium max-w-xs mt-2">
              Save your delivery locations for a
              faster checkout experience.
            </p>
          </Card>
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id} className="border border-slate-100 shadow-none rounded-2xl overflow-hidden hover:border-slate-300 transition-all group">
              <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-start gap-6">
                  <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xl text-slate-900">
                        {addr.firstName} {addr.lastName}
                      </span>
                      {addr.isDefault && (
                        <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded border border-primary/20">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 font-bold text-sm">
                      {addr.address}, {addr.city}, {addr.postalCode}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="font-black text-slate-900 hover:bg-slate-50 rounded-xl px-6"
                  onClick={() => router.push("/core/transaction1/profile?tab=address")}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
