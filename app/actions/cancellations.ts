"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitCancellationRequest(formData: {
  orderId: string;
  reason: string;
  details?: string;
  proofUrls?: string[];
}) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch order details to get shop owner for notification
    const { data: order, error: orderError } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .select("*, shops!inner(id, owner_id)")
      .eq("id", formData.orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message || "Order not found" };
    }

    // 2. Insert into order_cancellations
    // "to_pay" and "to_ship" are instantly approved. 
    // "to_receive" (already in transit) requires seller approval.
    const isInstant = order.status === "to_pay" || order.status === "to_ship";
    
    const { data: cancelRecord, error: cancelError } = await supabase
      .schema("bpm-anec-global")
      .from("order_cancellations")
      .insert({
        order_id: formData.orderId,
        reason: formData.reason + (formData.details ? `: ${formData.details}` : ""),
        status: isInstant ? "approved" : "pending_review",
      })
      .select()
      .single();

    if (cancelError) throw cancelError;

    // 3. Update Order Status
    if (isInstant) {
      const { error: updateError } = await supabase
        .schema("bpm-anec-global")
        .from("orders")
        .update({
          status: "cancelled",
        })
        .eq("id", formData.orderId);

      if (updateError) throw updateError;
    } else {
      // For to_receive orders, set status to cancel_pending for user feedback
      const { error: updateError } = await supabase
        .schema("bpm-anec-global")
        .from("orders")
        .update({
          status: "cancel_pending",
        })
        .eq("id", formData.orderId);

      if (updateError) throw updateError;
    }

    // 4. Notify Seller
    if (order.shops?.owner_id) {
      await supabase
        .schema("bpm-anec-global")
        .from("notifications")
        .insert({
          user_id: order.shops.owner_id,
          title: isInstant ? "Order Cancelled" : "Cancellation Request Received",
          message: `Order #${order.order_number || formData.orderId.slice(0, 8)} ${isInstant ? "has been cancelled by the customer." : "has a pending cancellation request."} Reason: ${formData.reason}`,
          type: "order",
          is_read: false,
        });
    }

    revalidatePath("/core/transaction1/purchases");
    revalidatePath("/core/transaction2/seller/orders");
    revalidatePath("/core/transaction2/seller/returns");
    
    return { success: true, data: { ...cancelRecord, isInstant } };
  } catch (error: any) {
    console.error("Cancellation submission error:", error);
    return { success: false, error: error.message };
  }
}

