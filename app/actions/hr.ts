"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function onboardEmployee(formData: {
  email: string;
  fullName: string;
  role: string;
  departmentId: string;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Create the user and send invitation via Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      formData.email,
      {
        data: {
          full_name: formData.fullName,
        },
        // You can specify a redirectTo URL here if needed
        // redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    );

    if (authError) throw authError;

    if (userData.user) {
      // 2. Update the profile entry
      // We'll update the role and department_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: formData.role,
          department_id: formData.departmentId,
        })
        .eq("id", userData.user.id);

      if (profileError) throw profileError;
    }

    revalidatePath("/hr/dept1/onboarding");
    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { success: false, error: error.message };
  }
}
