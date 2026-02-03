"use client";

import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export function LoadingOverlay({ isVisible, message = "Loading" }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="relative flex flex-col items-center justify-center gap-8">
                {/* Gold Pulse Animation Circle */}
                <div className="relative flex items-center justify-center">
                    {/* Pulsing outer rings */}
                    <div className="absolute h-32 w-32 rounded-full bg-amber-400/20 animate-ping duration-1000"></div>
                    <div className="absolute h-32 w-32 rounded-full bg-amber-400/10 animate-ping [animation-delay:200ms] duration-1000"></div>

                    {/* Centered Logo Container */}
                    <div className="relative h-28 w-28 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.15)] ring-4 ring-amber-50">
                        <img
                            src="/logo.png"
                            alt="Loading..."
                            className="h-16 w-16 object-contain ml-3"
                        />
                    </div>
                </div>

                {/* Loading Text Section */}
                <div className="flex flex-col items-center gap-3">
                    <h3 className="font-black text-amber-500 tracking-[0.3em] text-sm uppercase animate-pulse">
                        {message}
                    </h3>
                    <div className="flex gap-2">
                        <div className="h-2 w-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-amber-600 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
