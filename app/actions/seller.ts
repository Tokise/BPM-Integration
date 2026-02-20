"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getSellerOrder(
  orderId: string,
) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .select(
        `
                *,
                customer:profiles(*),
                items:order_items(
                    *,
                    product:products(name, price, images, product_category_links(category:categories(name)))
                )
            `,
      )
      .eq("id", orderId)
      .single();

    if (error) {
      console.error(
        "Error fetching order (Server Action):",
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateSellerOrderStatus(
  orderId: string,
  newStatus: string,
) {
  const supabase = createAdminClient();

  try {
    const updates: any = { status: newStatus };

    if (newStatus === "to_ship") {
      updates.payment_status = "paid";
    }
    if (newStatus === "to_receive") {
      updates.shipping_status = "shipped";
    }
    if (newStatus === "completed") {
      updates.shipping_status = "delivered";
    }

    // Fetch customer ID before update
    const { data: orderData } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .select("customer_id, order_number")
      .eq("id", orderId)
      .single();

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (error) {
      console.error(
        "Error updating order (Server Action):",
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }

    // Notify customer
    if (orderData?.customer_id) {
      const statusText = newStatus.replace("_", " ").toUpperCase();
      await supabase
        .schema("bpm-anec-global")
        .from("notifications")
        .insert({
          user_id: orderData.customer_id,
          title: `Order Status: ${statusText}`,
          message: `Your order #${orderId.slice(0, 8)} status has been updated to ${statusText}.`,
          type: "order",
          is_read: false
        });
    }

    revalidatePath(
      `/core/transaction2/seller/orders/${orderId}`,
    );
    revalidatePath(
      "/core/transaction2/seller/orders",
    );
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
