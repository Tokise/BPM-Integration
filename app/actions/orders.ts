"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Archive an order by updating its status to 'archived'
 * This avoids deleting order items and keeps the history intact.
 */
export async function archiveOrder(orderId: string) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .update({ status: "archived" })
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/core/transaction1/purchases");
    return { success: true };
  } catch (error: any) {
    console.error("Error archiving order:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an order from the database
 * This will also delete related records due to cascade or manual deletion if needed
 */
export async function deleteOrder(orderId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Delete order items first (if not cascading)
    await supabase
      .schema("bpm-anec-global")
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    // 2. Delete the order
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/core/transaction1/purchases");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return { success: false, error: error.message };
  }
}
