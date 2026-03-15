"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function checkLowStock(productId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Get product details and threshold
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("name, stock_qty, low_stock_threshold, shop_id")
      .eq("id", productId)
      .single();

    if (fetchError || !product) throw fetchError;

    // 2. Check if stock is low
    if (product.stock_qty <= (product.low_stock_threshold ?? 5)) {
      // 3. Get shop owner ID
      const { data: shop } = await supabase
        .from("shops")
        .select("owner_id")
        .eq("id", product.shop_id)
        .single();

      if (!shop) return;

      // 4. Create notification
      await supabase
        .schema("bpm-anec-global")
        .from("notifications")
        .insert({
          user_id: shop.owner_id,
          title: "Low Stock Alert",
          message: `Your product "${product.name}" has only ${product.stock_qty} items left.`,
          type: "system",
          is_read: false
        });
    }
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
}
export async function createNotification({
  userId,
  title,
  message,
  type = "system",
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
}) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .schema("bpm-anec-global")
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: false
    });

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function notifyDepartment({
  deptCode,
  title,
  message,
  type = "system",
}: {
  deptCode: string;
  title: string;
  message: string;
  type?: string;
}) {
  const supabase = createAdminClient();

  // 1. Get department ID
  const { data: dept, error: deptError } = await supabase
    .schema("bpm-anec-global")
    .from("departments")
    .select("id")
    .eq("code", deptCode)
    .single();

  if (deptError || !dept) {
    console.error(`Error finding department with code ${deptCode}:`, deptError);
    return;
  }

  // 2. Get all users in that department
  const { data: profiles, error } = await supabase
    .schema("bpm-anec-global")
    .from("profiles")
    .select("id")
    .eq("department_id", dept.id);

  if (error) {
    console.error(`Error fetching profiles for department ${dept.id}:`, error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.warn(`No profiles found for department: ${deptCode} (${dept.id}). Trying roles...`);
    // Fallback to role-based notification if no one is in the department
    const relatedRoles: Record<string, string[]> = {
      "FINANCE": ["finance_admin", "finance_employee", "admin"],
      "HR_DEPT4": ["hr4_admin", "hr4_employee", "admin"],
      "HR_DEPT1": ["hr1_admin", "hr1_employee", "admin"]
    };
    
    if (relatedRoles[deptCode]) {
      return notifyRoles({ 
        roles: relatedRoles[deptCode], 
        title, 
        message, 
        type 
      });
    }
    return;
  }

  // 2. Insert notifications for each user
  const notifications = profiles.map(p => ({
    user_id: p.id,
    title,
    message,
    type,
    is_read: false
  }));

  const { error: insertError } = await supabase
    .schema("bpm-anec-global")
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    console.error(`Error inserting notifications for dept ${deptCode}:`, insertError);
  }
}

export async function notifyRoles({
  roles,
  title,
  message,
  type = "system",
}: {
  roles: string[];
  title: string;
  message: string;
  type?: string;
}) {
  const supabase = createAdminClient();

  // 1. Get profiles by role name (joined from roles table)
  const { data: profiles, error } = await supabase
    .schema("bpm-anec-global")
    .from("profiles")
    .select("id, roles!profiles_role_id_fkey!inner(name)")
    .in("roles.name", roles);

  if (error) {
    console.error(`Error fetching profiles for roles ${roles.join(", ")}:`, error);
    return;
  }

  if (!profiles || profiles.length === 0) return;

  // 2. Insert notifications
  const notifications = profiles.map(p => ({
    user_id: p.id,
    title,
    message,
    type,
    is_read: false
  }));

  await supabase
    .schema("bpm-anec-global")
    .from("notifications")
    .insert(notifications);
}
