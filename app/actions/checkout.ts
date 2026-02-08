"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function ensureProfile(userId: string, email: string, fullName: string = "User") {
    // Prefer admin client to bypass RLS for profile creation
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createAdminClient()
        : await createClient();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Profile creation might fail due to RLS.");
    }

    try {
        // 1. Check if profile exists (using default schema)
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single();

        if (existingProfile) {
            return { success: true };
        }



        // 2. Try to create profile in default schema
        const { error: insertError } = await supabase.from("profiles").insert({
            id: userId,
            email: email,
            role: "customer",
            full_name: fullName,
        });

        if (!insertError) {
            return { success: true };
        }

        console.error("Error creating profile in default schema:", insertError);

        // 3. Fallback: Try public schema (admin client handles schemas explicitly better)
        const { error: publicInsertError } = await supabase
            .schema("public")
            .from("profiles")
            .insert({
                id: userId,
                email: email,
                role: "customer",
                full_name: fullName,
            });

        if (publicInsertError) {
            console.error("Error creating profile in public schema:", publicInsertError);
            return {
                success: false,
                error: insertError.message || publicInsertError.message,
            };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Unexpected error in ensureProfile:", error);
        return { success: false, error: error.message || "Unexpected error" };
    }
}
