"use client";

import { useUser } from "@/context/UserContext";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export function AuthTransitionOverlay() {
    const { isAuthenticating, authMessage } = useUser();
    return <LoadingOverlay isVisible={isAuthenticating} message={authMessage} />;
}
