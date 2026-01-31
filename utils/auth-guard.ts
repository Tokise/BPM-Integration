
"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function useAuthGuard() {
    const supabase = createClient();
    const router = useRouter();

    const protectAction = async (nextPath: string) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Encode the next path to handle query params correctly
            router.push(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
            return false;
        }

        return true;
    };

    return { protectAction };
}
