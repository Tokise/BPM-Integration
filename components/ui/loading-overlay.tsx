"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative flex flex-col items-center">
                {/* Animated Rings */}
                <div className="absolute inset-0 -m-4">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20 animate-ping duration-[3000ms]" />
                </div>

                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 animate-pulse transition-all">
                    <img src="/logo.png" alt="Anec Logo" className="h-10 w-auto" />
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                            {message || "Processing..."}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                        Please wait a moment
                    </p>
                </div>
            </div>
        </div>
    );
}
