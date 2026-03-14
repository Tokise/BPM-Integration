"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

/**
 * Monitors user activity and signs out after 10 minutes of inactivity.
 */
export function InactivityHandler() {
  const { user, signOut } = useUser();
  const pathname = usePathname();
  const [isWarningShown, setIsWarningShown] = useState(false);
  
  // 10 minutes session limit
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 600,000 ms
  const WARNING_THRESHOLD = 30 * 1000; // 30 seconds before limit
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (!user) return;
    
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    setIsWarningShown(false);

    // Set warning timer (10 mins - 30 seconds)
    warningTimerRef.current = setTimeout(() => {
      if (user && !pathname.startsWith("/auth")) {
        setIsWarningShown(true);
        toast.warning("Session Security Alert", {
          description: "Your session will expire in 30 seconds due to inactivity. Please move your mouse or press a key to stay logged in.",
          duration: 25000,
          id: "inactivity-warning",
        });
      }
    }, INACTIVITY_LIMIT - WARNING_THRESHOLD);

    // Set actual logout timer
    timerRef.current = setTimeout(() => {
      if (user && !pathname.startsWith("/auth")) {
        signOut(true); // Force sign out
        toast.error("Session Expired", {
          description: "You have been logged out due to 10 minutes of inactivity.",
          duration: 10000,
        });
      }
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      return;
    }

    // Initial timer set
    resetTimer();

    // Events to track activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, pathname]);

  return null; // Side-effect only component
}
