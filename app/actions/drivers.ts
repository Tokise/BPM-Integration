"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function createDriverProfile(fullName: string, email: string) {
  try {
    const supabaseAdmin = createAdminClient();
    
    // First create the auth user
    // Generate a secure random password since they will likely reset it or use magic links
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      }
    });

    if (authError) {
      console.error("Failed to create driver auth user:", authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // The trigger automatically creates a profile, so we just need to update it
    const { error: profileError } = await supabaseAdmin
      .schema("bpm-anec-global")
      .from("profiles")
      .update({
        full_name: fullName,
        role: "driver"
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Failed to update driver profile:", profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true, userId };
    
  } catch (error: any) {
    console.error("Error in createDriverProfile:", error);
    return { success: false, error: error.message };
  }
}
