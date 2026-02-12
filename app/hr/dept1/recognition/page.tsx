"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Award,
  Sparkles,
  Heart,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecognitionPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Social Recognition
          </h1>
          <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">
            Celebrate employee achievements
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-amber-200">
          <Sparkles className="h-5 w-5" /> Give
          Recognition
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-24 w-24 bg-pink-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-pink-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            No recognitions yet
          </h3>
          <p className="text-slate-500 font-medium max-w-sm mt-2">
            Be the first to recognize a
            colleague's hard work and dedication!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
