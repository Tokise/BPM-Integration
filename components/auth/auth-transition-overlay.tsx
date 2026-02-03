"use client";

import { useUser } from "@/context/UserContext";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export function AuthTransitionOverlay() {
    const { loading, isAuthenticating, authMessage } = useUser();
    return <LoadingOverlay isVisible={loading || isAuthenticating} message={authMessage || "Loading..."} />;
}
