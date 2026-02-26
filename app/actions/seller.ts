"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";


/**
 * Fetch a single order with detailed information for the seller
 */
export async function getSellerOrder(orderId: string) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .select(`
        *,
        customer:profiles(full_name, email),
        items:order_items(
          *,
          product:products(
            id,
            name,
            images
          )
        )
      `)
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching seller order:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update the status of a seller order
 */
export async function updateSellerOrderStatus(orderId: string, status: string) {
  const supabase = createAdminClient();

  try {
    const updates: any = { status };
    
    // Auto-update related fields based on status
    if (status === "to_receive") {
      updates.shipping_status = "shipped";
    } else if (status === "delivered") {
      updates.shipping_status = "delivered";
      updates.delivered_at = new Date().toISOString();
    } else if (status === "completed") {
      updates.shipping_status = "delivered";
      updates.payment_status = "paid";
    }

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/core/transaction2/seller/orders");
    revalidatePath(`/core/transaction2/seller/orders/${orderId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating seller order status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Internal helper to complete an order (updates status, creates payout, sends notification)
 */
async function completeOrderInternal(orderId: string, supabase: any) {
  // 1. Fetch order details
  const { data: order, error: orderError } = await supabase
    .schema("bpm-anec-global")
    .from("orders")
    .select("*, shops!inner(id, owner_id)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Order not found");
  }

  // 2. Mark order as completed
  const { error: updateError } = await supabase
    .schema("bpm-anec-global")
    .from("orders")
    .update({
      status: "completed",
      shipping_status: "delivered",
      payment_status: "paid",
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  // 3. Calculate COD fee breakdown
  const gross = Number(order.total_amount);
  const COMMISSION_RATE = 0.03;        // 3%
  const PAYMENT_FEE_RATE = 0.0224;     // 2.24%
  const WITHHOLDING_TAX_RATE = 0.005;  // 0.5%

  const commissionFee = Math.round(gross * COMMISSION_RATE * 100) / 100;
  const paymentFee = Math.round(gross * PAYMENT_FEE_RATE * 100) / 100;
  const withholdingTax = Math.round(gross * WITHHOLDING_TAX_RATE * 100) / 100;
  const netAmount = Math.round((gross - commissionFee - paymentFee - withholdingTax) * 100) / 100;

  // 4. Create payout record
  const { error: payoutError } = await supabase
    .schema("bpm-anec-global")
    .from("payout_management")
    .insert({
      shop_id: order.shop_id,
      order_id: orderId,
      gross_amount: gross,
      commission_fee: commissionFee,
      payment_processing_fee: paymentFee,
      withholding_tax: withholdingTax,
      shipping_subsidy: 0,
      amount: netAmount,
      status: "pending",
    });

  if (payoutError) throw payoutError;

  // 5. Notify seller about completion (manual or auto)
  if (order.shops?.owner_id) {
    await supabase
      .schema("bpm-anec-global")
      .from("notifications")
      .insert({
        user_id: order.shops.owner_id,
        title: "Order Completed",
        message: `Order #${orderId.slice(0, 8)} is now completed. ₱${netAmount.toLocaleString()} payout is pending.`,
        type: "order",
        is_read: false,
      });
  }

  return { netAmount };
}

// COD Payout: Customer confirms receipt → order completed → payout auto-created
export async function confirmOrderReceived(orderId: string) {
  const supabase = createAdminClient();

  try {
    const { data: order } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (order?.status !== "delivered") {
      return { success: false, error: "Order must be in 'delivered' status" };
    }

    await completeOrderInternal(orderId, supabase);

    revalidatePath("/core/transaction1/purchases");
    revalidatePath("/core/transaction2/seller/orders");
    revalidatePath("/core/transaction2/seller/earnings");
    revalidatePath("/core/transaction3/admin/payouts");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Auto-complete orders that have been in 'delivered' status for > 24 hours
 */
export async function autoCompleteDeliveredOrders(shopId: string) {
  const supabase = createAdminClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Find orders in 'delivered' status for > 24 hours
    const { data: overdueOrders, error: fetchError } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .select("id")
      .eq("shop_id", shopId)
      .eq("status", "delivered")
      .lt("delivered_at", oneDayAgo);

    if (fetchError) throw fetchError;
    if (!overdueOrders || overdueOrders.length === 0) {
      return { success: true, processedCount: 0 };
    }

    // 2. Process each overdue order
    const results = await Promise.all(
      overdueOrders.map(async (order) => {
        try {
          await completeOrderInternal(order.id, supabase);
          return { id: order.id, success: true };
        } catch (err) {
          console.error(`Auto-completion failed for order ${order.id}:`, err);
          return { id: order.id, success: false };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;

    if (successCount > 0) {
      revalidatePath("/core/transaction2/seller/orders");
      revalidatePath("/core/transaction2/seller/earnings");
      revalidatePath("/core/transaction3/admin/payouts");
    }

    return { success: true, processedCount: overdueOrders.length, successCount };
  } catch (error: any) {
    console.error("Error in autoCompleteDeliveredOrders:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch cancellation requests for a specific shop
 */
export async function getSellerCancellations(shopId: string) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("order_cancellations")
      .select(
        `*, 
         orders!inner(
           id,
           shop_id, 
           order_number, 
           total_amount, 
           status,
           customer:profiles(full_name, email),
           order_items(product_name, product_image, quantity)
         )`,
      )
      .eq("orders.shop_id", shopId)
      .order("id", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching seller cancellations:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch return requests for a specific shop
 */
export async function getSellerReturns(shopId: string) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("order_returns")
      .select(
        `*, 
         orders!inner(
           id,
           shop_id, 
           order_number, 
           total_amount, 
           status,
           customer_id,
           customer:profiles(full_name, email),
           order_items(product_name, product_image, quantity)
         )`,
      )
      .eq("orders.shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching seller returns:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle a cancellation request (approve or reject)
 */
export async function handleCancellationRequest(
  cancellationId: string,
  orderId: string,
  action: "approve" | "reject",
) {
  const supabase = createAdminClient();

  try {
    if (action === "approve") {
      // 1. Update cancellation status
      const { error: cancelError } = await supabase
        .schema("bpm-anec-global")
        .from("order_cancellations")
        .update({ status: "approved" })
        .eq("id", cancellationId);

      if (cancelError) throw cancelError;

      // 2. Update order status to cancelled
      const { error: orderError } = await supabase
        .schema("bpm-anec-global")
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (orderError) throw orderError;
    } else {
      // Reject: Just update the cancellation status
      const { error: cancelError } = await supabase
        .schema("bpm-anec-global")
        .from("order_cancellations")
        .update({ status: "rejected" })
        .eq("id", cancellationId);

      if (cancelError) throw cancelError;
      
      // Optional: Revert order status from cancel_pending back to something else?
      // For now, keeping it simple as per implementation plan.
    }

    revalidatePath("/core/transaction1/purchases");
    revalidatePath("/core/transaction2/seller/returns");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error handling cancellation request:", error);
    return { success: false, error: error.message };
  }
}
