"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getSellerOrder(orderId: string) {
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:profiles(*),
                items:order_items(
                    *,
                    product:products(name, price, images, category:categories(name))
                )
            `)
            .eq('id', orderId)
            .single();

        if (error) {
            console.error("Error fetching order (Server Action):", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSellerOrderStatus(orderId: string, newStatus: string) {
    const supabase = createAdminClient();

    try {
        const updates: any = { status: newStatus };

        if (newStatus === 'to_ship') {
            updates.payment_status = 'paid';
        }
        if (newStatus === 'to_receive') {
            updates.shipping_status = 'shipped';
        }
        if (newStatus === 'completed') {
            updates.shipping_status = 'delivered';
        }

        const { error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId);

        if (error) {
            console.error("Error updating order (Server Action):", error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/seller/orders/${orderId}`);
        revalidatePath('/seller/orders');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
