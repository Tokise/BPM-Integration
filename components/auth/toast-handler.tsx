"use client";

import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import {
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation";

function ToastHandlerContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Check URL parameters (backward compatibility)
    const messageParam =
      searchParams.get("message") ||
      searchParams.get("success");
    const errorParam = searchParams.get("error");

    // 2. Check Cookies (for "stealth" toasts)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return decodeURIComponent(
          parts.pop()?.split(";").shift() || "",
        );
      return null;
    };

    const deleteCookie = (name: string) => {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    };

    const cookieMessage = getCookie(
      "app_toast_message",
    );
    const cookieError = getCookie(
      "app_toast_error",
    );

    const finalMessage =
      cookieMessage || messageParam;
    const finalError = cookieError || errorParam;

    if (finalMessage) {
      toast.success(finalMessage, {
        duration: 5000,
      });
      if (cookieMessage)
        deleteCookie("app_toast_message");
    }

    if (finalError) {
      toast.error(finalError, {
        duration: 5000,
      });
      if (cookieError)
        deleteCookie("app_toast_error");
    }

    // Clean up URL parameters if they were used
    if (messageParam || errorParam) {
      const params = new URLSearchParams(
        searchParams.toString(),
      );
      params.delete("message");
      params.delete("success");
      params.delete("error");

      const newURL = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      window.history.replaceState(
        null,
        "",
        newURL,
      );
    }
  }, [searchParams, pathname]);

  return null;
}

export function ToastHandler() {
  return (
    <Suspense fallback={null}>
      <ToastHandlerContent />
    </Suspense>
  );
}
