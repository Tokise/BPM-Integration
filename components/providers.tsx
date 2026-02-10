
"use client";

import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { RealtimeNotifications } from "@/components/realtime-notifications";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <RealtimeNotifications />
            <CartProvider>
                {children}
            </CartProvider>
        </UserProvider>
    );
}
