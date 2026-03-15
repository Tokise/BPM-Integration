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
 * Sync warehouse inventory FROM products.stock_qty so warehouse matches seller.
 * Called on warehouse detail page load.
 */
export async function syncWarehouseFromProducts(shopId: string) {
  const supabase = createAdminClient();

  try {
    // Get all warehouse_inventory for this shop with their product stock
    const { data: inventory } = await supabase
      .schema("bpm-anec-global")
      .from("warehouse_inventory")
      .select("id, quantity, product_id, products(id, stock_qty)")
      .eq("shop_id", shopId);

    if (!inventory) return { success: true };

    for (const item of inventory) {
      const productStock = (item as any).products?.stock_qty;
      if (productStock !== undefined && productStock !== item.quantity) {
        await supabase
          .schema("bpm-anec-global")
          .from("warehouse_inventory")
          .update({
            quantity: productStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
    }

    revalidatePath("/logistic/dept1/warehouse");
    return { success: true };
  } catch (error: any) {
    console.error("Error syncing warehouse from products:", error);
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
export async function receiveShipment(pendingItem: any, storageLocation?: string) {
  const supabase = createAdminClient();
  const itemsToProcess = pendingItem.items?.list || [
    {
      product_id: pendingItem.product_id,
      quantity: pendingItem.quantity,
      name: pendingItem.products?.name,
    },
  ];

  try {
    // 1. Mark shipment as received
    const { error: sError } = await supabase
      .schema("bpm-anec-global")
      .from("shipments")
      .update({ status: "received" })
      .eq("id", pendingItem.id);
    if (sError) throw sError;

    // 2. Loop through items and update inventory
    for (const item of itemsToProcess) {
       if (!item.product_id) continue;

       // 2.1 Update related procurement record for this product
       await supabase
         .schema("bpm-anec-global")
         .from("procurement")
         .update({ status: "received" })
         .eq("product_id", item.product_id)
         .in("status", ["requested", "approved", "fbs_pickup_requested", "fbs_forwarded_to_fleet", "fbs_in_transit"]);

       // 2.2 Add to warehouse_inventory
       const { data: existing } = await supabase
         .schema("bpm-anec-global")
         .from("warehouse_inventory")
         .select("id, quantity")
         .eq("product_id", item.product_id)
         .limit(1)
         .single();

       if (existing) {
         const newInvQty = (existing.quantity || 0) + item.quantity;
         const { error: invUpdateErr } = await supabase
           .schema("bpm-anec-global")
           .from("warehouse_inventory")
           .update({
             quantity: newInvQty,
             storage_location: storageLocation || undefined,
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
             product_id: item.product_id,
             warehouse_id: warehouses?.id || null,
             shop_id: pendingItem.products?.shop_id || item.shop_id,
             quantity: item.quantity,
             storage_location: storageLocation || null,
           });
         if (invInsertErr) throw invInsertErr;
       }

       // 2.3 Update product stock table
       // Fetch current product stock first to be safe
       const { data: prodData } = await supabase
         .schema("bpm-anec-global")
         .from("products")
         .select("stock_qty")
         .eq("id", item.product_id)
         .single();
       
       const currentStock = prodData?.stock_qty || 0;
       const { error: prodError } = await supabase
         .schema("bpm-anec-global")
         .from("products")
         .update({ stock_qty: currentStock + item.quantity })
         .eq("id", item.product_id);
       if (prodError) throw prodError;
    }

    revalidatePath("/logistic/dept1/warehouse");
    revalidatePath("/core/transaction2/fbs/products");

    return { success: true };
  } catch (error: any) {
    console.error("Error receiving shipment:", error);
    return { success: false, error: error.message };
  }
}
