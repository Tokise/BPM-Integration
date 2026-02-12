"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isAdminPage =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/hr") ||
    pathname?.startsWith("/logistic") ||
    pathname?.startsWith("/finance") ||
    pathname?.startsWith("/seller") ||
    pathname?.startsWith(
      "/core/transaction3/admin",
    ) || // Added modular admin
    pathname?.startsWith(
      "/core/transaction2/seller",
    ) || // Added modular seller
    pathname?.match(
      /^\/core\/transaction1\/shop\/[^/]+$/,
    ); // Added public storefront

  if (isAdminPage) return null;

  return (
    <footer className="relative w-full overflow-hidden">
      {/* Simple Repeating Wave Background - Stretched to fill full content height */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/footer.png')",
          backgroundSize: "600px 100%", // Fills full height, repeats horizontally
          backgroundPosition: "left top",
          backgroundRepeat: "repeat-x",
        }}
      />

      <div className="relative pt-32 pb-12 z-20">
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            {/* Company Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Anec Global Logo"
                  className="h-16 w-auto"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg">
                  All Nations Elite Circle
                </h3>
                <p className="text-white/80 text-sm hover:text-primary transition-colors cursor-pointer">
                  +63 2 845 0799
                </p>
                <p className="text-white/80 text-sm hover:text-primary transition-colors cursor-pointer">
                  anec@ims.com.ph
                </p>
              </div>
            </div>

            {/* Become a Seller */}
            <div className="space-y-6">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">
                Become a Seller
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Sell on ANEC Global
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Merchants
                  </a>
                </li>
              </ul>
            </div>

            {/* About */}
            <div className="space-y-6">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">
                About ANEC Global
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    About ANEC Global
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Vendor Listing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Rewards
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Referral Program
                  </a>
                </li>
              </ul>
            </div>

            {/* Help */}
            <div className="space-y-6">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">
                Help
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Shipping Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-primary text-sm transition-colors"
                  >
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 space-y-6 text-center">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a
                href="#"
                className="text-xs font-bold text-white hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-white/20 hidden md:inline">
                |
              </span>
              <a
                href="#"
                className="text-xs font-bold text-white hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-white/20 hidden md:inline">
                |
              </span>
              <a
                href="#"
                className="text-xs font-bold text-white hover:text-primary transition-colors"
              >
                Contact Us
              </a>
            </div>
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em]">
              Copyright © 2024 ANEC Global. All
              Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
