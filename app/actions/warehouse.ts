"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Synchronize all product stock levels for a specific seller based on warehouse inventory.
 */
export async function syncAllSellerStock(shopId: string, items: any[]) {
  const supabase = createAdminClient();

  try {
    for (const item of items) {
      if (item.products?.id) {
        const { error } = await supabase
          .schema("bpm-anec-global")
          .from("products")
          .update({
            stock_qty: item.quantity,
          })
          .eq("id", item.products.id);

        if (error) throw error;
      }
    }

    revalidatePath("/logistic/dept1/warehouse");
    revalidatePath("/core/transaction2/fbs/products");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error syncing seller stock:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update both warehouse inventory and product stock (Pick/Pack action).
 */
export async function updateInventoryAndStock(inventoryId: string, productId: string, newQty: number) {
  const supabase = createAdminClient();

  try {
    // 1. Update warehouse inventory
    const { error: invError } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventoryId);

    if (invError) throw invError;

    // 2. Update product stock
    const { error: prodError } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .update({ stock_qty: newQty })
      .eq("id", productId);

    if (prodError) throw prodError;

    revalidatePath("/logistic/dept1/warehouse");
    revalidatePath("/core/transaction2/fbs/products");

    return { success: true, newQty };
  } catch (error: any) {
    console.error("Error updating inventory and stock:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Receive a pending inbound shipment.
 * Updates procurement/shipment status, warehouse inventory, and product stock.
 */
export async function receiveShipment(pendingItem: any) {
  const supabase = createAdminClient();
  const qty = pendingItem.quantity;
  const product = pendingItem.products;

  try {
    // 1. Mark shipment/procurement as received
    // The current page uses 'shipments' for fbs_inbound but handleReceivePending was trying to update 'procurement'
    // Let's handle 'shipments' as it's the primary table for FBS inbound now.
    const { error: sError } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .update({
        status: "received",
        // updated_at is handled by default usually or we can add it if exists
      })
      .eq("id", pendingItem.id);

    if (sError) throw sError;

    // 2. Add to warehouse_inventory
    const { data: existing } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .select("id, quantity")
      .eq("product_id", product.id)
      .limit(1)
      .single();

    let finalQty = qty;

    if (existing) {
      finalQty = (existing.quantity || 0) + qty;
      const { error: invUpdateErr } = await supabase
        .schema("bpm-anec-global")
        .from("warehouse_inventory")
        .update({
          quantity: finalQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      
      if (invUpdateErr) throw invUpdateErr;
    } else {
      const { data: warehouses } = await supabase
        .schema("bpm-anec-global")
        .from("warehouses")
        .select("id")
        .limit(1)
        .single();

      const { error: invInsertErr } = await supabase
        .schema("bpm-anec-global")
        .from("warehouse_inventory")
        .insert({
          product_id: product.id,
          warehouse_id: warehouses?.id || null,
          shop_id: product.shop_id,
          quantity: qty,
        });
      
      if (invInsertErr) throw invInsertErr;
    }

    // 3. Update product stock
    const { error: prodError } = await supabase
      .schema("bpm-anec-global")
      .from("products")
      .update({
        stock_qty: (product.stock_qty || 0) + qty,
      })
      .eq("id", product.id);

    if (prodError) throw prodError;

    revalidatePath("/logistic/dept1/warehouse");
    revalidatePath("/core/transaction2/fbs/products");

    return { success: true, addedQty: qty, finalQty: (product.stock_qty || 0) + qty };
  } catch (error: any) {
    console.error("Error receiving shipment:", error);
    return { success: false, error: error.message };
  }
}
