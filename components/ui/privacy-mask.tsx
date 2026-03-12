"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrivacyMaskProps {
  value: string | number;
  maskChar?: string;
  isVisibleDefault?: boolean;
}

export function PrivacyMask({
  value,
  maskChar = "•",
  isVisibleDefault = false,
}: PrivacyMaskProps) {
  const [isVisible, setIsVisible] = useState(
    isVisibleDefault,
  );

  const displayValue = isVisible
    ? value
    : typeof value === "string"
      ? maskChar.repeat(
          Math.min(value.length, 12),
        )
      : maskChar.repeat(8);

  return (
    <div className="flex items-center gap-2 group/privacy">
      <span
        className={`font-mono transition-all duration-300 ${isVisible ? "text-slate-900" : "text-slate-400 opacity-50"}`}
      >
        {displayValue}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full opacity-0 group-hover/privacy:opacity-100 transition-opacity hover:bg-slate-100"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? (
          <EyeOff className="h-3 w-3 text-slate-400" />
        ) : (
          <Eye className="h-3 w-3 text-slate-600" />
        )}
      </Button>
    </div>
  );
}
