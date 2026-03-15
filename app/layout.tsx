import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const font = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anec Global",
  description:
    "Redefining Local Commerce for Global Standards",
};

import { Suspense } from "react";
import { ToastHandler } from "@/components/auth/toast-handler";
import { InactivityHandler } from "@/components/auth/inactivity-handler";
import { SellerApprovalPopup } from "@/components/layout/SellerApprovalPopup";
import { HeaderWrapper, FooterWrapper } from "@/components/layout/ConditionalWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        <Providers>
          <Toaster
            position="top-center"
            expand={false}
            richColors
          />
          <ToastHandler />
          <InactivityHandler />
          <SellerApprovalPopup />
          <Suspense
            fallback={
              <div className="h-14 w-full bg-background/95 border-b" />
            }
          >
            {/* Conditional Header: Hide on Verify OTP */}
            <HeaderWrapper />
          </Suspense>
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          {/* Conditional Footer: Hide on Verify OTP */}
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
