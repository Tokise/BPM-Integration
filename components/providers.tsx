
"use client";

import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { AuthTransitionOverlay } from "@/components/auth/auth-transition-overlay";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <AuthTransitionOverlay />
            <CartProvider>
                {children}
            </CartProvider>
        </UserProvider>
    );
}
