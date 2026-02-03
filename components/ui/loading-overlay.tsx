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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center">
                {/* Subtle pulse effect */}
                <div className="absolute w-20 h-20 bg-primary/20 rounded-full animate-ping duration-[2000ms]" />
                <div className="relative h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <img src="/logo.png" alt="Anec Global" className="h-10 w-auto" />
                </div>
            </div>
        </div>
    );
}
