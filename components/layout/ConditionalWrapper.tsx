"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function HeaderWrapper() {
  const pathname = usePathname();
  if (pathname === "/auth/verify-otp") return null;
  return <Header />;
}

export function FooterWrapper() {
  const pathname = usePathname();
  if (pathname === "/auth/verify-otp") return null;
  return <Footer />;
}
