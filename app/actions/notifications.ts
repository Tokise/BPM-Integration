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
