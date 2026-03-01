"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function getUserGrowthStats() {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Fetch users using the admin bypass to access auth schema
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 10000 // Get all for stats
    });

    if (error) {
      console.error("Failed to fetch auth.users for growth stats:", error);
      return [];
    }

    const now = new Date();
    const uMonths: Record<string, number> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      uMonths[d.toLocaleDateString(undefined, { month: "short" })] = 0;
    }

    // Populate counts based on auth user created_at
    (users || []).forEach((u) => {
      const key = new Date(u.created_at).toLocaleDateString(undefined, { month: "short" });
      if (uMonths[key] !== undefined) uMonths[key]++;
    });

    return Object.entries(uMonths).map(([month, count]) => ({ month, count }));
    
  } catch (error) {
    console.error("Error in getUserGrowthStats:", error);
    return [];
  }
}
