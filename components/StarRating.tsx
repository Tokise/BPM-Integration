"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
    showNumber?: boolean;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

export default function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    showNumber = true,
    interactive = false,
    onRatingChange,
}: StarRatingProps) {
    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };

    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    const handleStarClick = (starIndex: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(starIndex + 1);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, index) => {
                const filled = index < Math.floor(rating);
                const halfFilled = index < rating && index >= Math.floor(rating);

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleStarClick(index)}
                        disabled={!interactive}
                        className={cn(
                            "relative",
                            interactive && "cursor-pointer hover:scale-110 transition-transform"
                        )}
                    >
                        {halfFilled ? (
                            <div className="relative">
                                <Star className={cn(sizeClasses[size], "text-slate-300")} />
                                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                                    <Star className={cn(sizeClasses[size], "text-amber-400 fill-amber-400")} />
                                </div>
                            </div>
                        ) : (
                            <Star
                                className={cn(
                                    sizeClasses[size],
                                    filled
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-300"
                                )}
                            />
                        )}
                    </button>
                );
            })}
            {showNumber && (
                <span className={cn("font-bold text-slate-600 ml-1", textSizeClasses[size])}>
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
