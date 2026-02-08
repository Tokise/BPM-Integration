
"use client";

import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { AuthTransitionOverlay } from "@/components/auth/auth-transition-overlay";
import { RealtimeNotifications } from "@/components/realtime-notifications";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <AuthTransitionOverlay />
            <RealtimeNotifications />
            <CartProvider>
                {children}
            </CartProvider>
        </UserProvider>
    );
}
