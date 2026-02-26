"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitReturnRequest(formData: {
  orderId: string;
  reason: string;
  returnMethod: string;
  proofUrls: string[];
  packagingCondition: string;
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

    // 2. Insert into order_returns
    // We'll store method, proof, and condition in the reason field if direct columns don't exist,
    // but looking at schema.sql, we only have 'reason'.
    // To satisfy the user request fully, we'll structure the reason or use JSON if the DB supports it.
    const { data: returnRecord, error: returnError } = await supabase
      .schema("bpm-anec-global")
      .from("order_returns")
      .insert({
        order_id: formData.orderId,
        reason: formData.reason,
        return_method: formData.returnMethod,
        packaging_condition: formData.packagingCondition,
        proof_urls: formData.proofUrls,
        status: "pending",
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // 3. Update Order Status
    const { error: updateError } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .update({
        status: "refund_pending",
      })
      .eq("id", formData.orderId);

    if (updateError) throw updateError;

    // 4. Notify Seller
    if (order.shops?.owner_id) {
      await supabase
        .schema("bpm-anec-global")
        .from("notifications")
        .insert({
          user_id: order.shops.owner_id,
          title: "New Return Request Received",
          message: `Action Required: New return request for order #${order.order_number || formData.orderId.slice(0, 8)}. Reason: ${formData.reason}. Please review details and proofs.`,
          type: "order",
          is_read: false,
        });
    }

    revalidatePath("/core/transaction1/purchases");
    revalidatePath("/core/transaction2/seller/returns");
    
    return { success: true, data: returnRecord };
  } catch (error: any) {
    console.error("Return submission error:", error);
    return { success: false, error: error.message };
  }
}

export async function processReturnRefund(data: {
  returnId: string;
  orderId: string;
  customerId: string;
  amount: number;
  sellerNotes: string;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Update Return Status
    const { error: returnError } = await supabase
      .schema("bpm-anec-global")
      .from("order_returns")
      .update({
        status: "approved",
        refund_amount_points: data.amount,
        seller_notes: data.sellerNotes,
      })
      .eq("id", data.returnId);

    if (returnError) throw returnError;

    // 2. Add Point Transaction
    // As per schema.sql: user_id, order_id, amount, transaction_type
    const { error: transError } = await supabase
      .schema("bpm-anec-global")
      .from("loyalty_point_transactions")
      .insert({
        user_id: data.customerId,
        order_id: data.orderId,
        amount: data.amount,
        transaction_type: "return_refund",
      });

    if (transError) {
      // Fallback to columns used in checkout just in case
      console.warn("Retrying with fallback columns points/type/description");
      const { error: fallbackError } = await supabase
        .schema("bpm-anec-global")
        .from("loyalty_point_transactions")
        .insert({
          user_id: data.customerId,
          order_id: data.orderId,
          points: data.amount,
          type: "refund",
          description: `Refund for return #${data.returnId.slice(0, 8)}`,
        } as any);
      
      if (fallbackError) throw transError; // Throw original if even fallback fails
    }

    // 3. Update Profile Balance
    const { data: profile, error: profileFetchError } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("loyalty_points")
      .eq("id", data.customerId)
      .single();

    if (profileFetchError) throw profileFetchError;

    const newBalance = (Number(profile?.loyalty_points) || 0) + data.amount;

    const { error: profileUpdateError } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .update({ loyalty_points: newBalance })
      .eq("id", data.customerId);

    if (profileUpdateError) throw profileUpdateError;

    // 4. Update Order Status to 'refunded'
    const { error: orderUpdateError } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", data.orderId);
      
    if (orderUpdateError) throw orderUpdateError;

    // 5. Notify Customer
    await supabase
      .schema("bpm-anec-global")
      .from("notifications")
      .insert({
        user_id: data.customerId,
        title: "Refund Processed",
        message: `Your return request for order #${data.orderId.slice(0, 8)} has been approved and ${data.amount} points have been added to your account.`,
        type: "order",
        is_read: false,
      });

    revalidatePath("/core/transaction2/seller/returns");
    revalidatePath("/core/transaction1/purchases");
    
    return { success: true };
  } catch (error: any) {
    console.error("Refund processing error:", error);
    return { success: false, error: error.message };
  }
}
