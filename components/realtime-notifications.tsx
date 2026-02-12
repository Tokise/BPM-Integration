"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RealtimeNotifications() {
  const { user, profile, addNotification } =
    useUser();
  const router = useRouter();
  const supabase = createClient();
  const [shopId, setShopId] = useState<
    string | null
  >(null);

  // Fetch Shop ID if seller
  useEffect(() => {
    async function fetchShop() {
      if (user && profile?.role === "seller") {
        const { data } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setShopId(data.id);
        }
      }
    }
    fetchShop();
  }, [user, profile]);

  // Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime_orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "bpm-anec-global",
          table: "orders",
        },
        (payload: any) => {
          const newOrder = payload.new;

          // Notify Seller of New Order
          if (
            shopId &&
            newOrder.shop_id === shopId
          ) {
            const message = `Order #${newOrder.id.slice(0, 8)} needs confirmation.`;
            toast.success("New Order Received!", {
              description: message,
              action: {
                label: "View",
                onClick: () =>
                  router.push(
                    `/seller/orders/${newOrder.id}`,
                  ),
              },
            });
            addNotification({
              title: "New Order Received",
              message: message,
              type: "order",
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "bpm-anec-global",
          table: "orders",
        },
        (payload: any) => {
          const newOrder = payload.new;
          const oldOrder = payload.old; // Note: 'old' might be empty depending on Replica Identity

          // Notify Customer of Status Change
          if (newOrder.customer_id === user.id) {
            // Check if status changed
            if (
              newOrder.status !==
                oldOrder?.status ||
              !oldOrder
            ) {
              // Map status to friendly text
              const statusText = newOrder.status
                .replace("_", " ")
                .replace(/\b\w/g, (l: string) =>
                  l.toUpperCase(),
                );
              const message = `Order #${newOrder.id.slice(0, 8)} is now ${statusText}.`;

              toast.info(`Order Status Updated`, {
                description: message,
                action: {
                  label: "View",
                  onClick: () =>
                    router.push(`/purchases`),
                },
              });
              addNotification({
                title: "Order Status Updated",
                message: message,
                type: "order",
              });
            }
          }

          // Notify Seller of Payment/Status Updates (e.g. if they just marked it)
          // (Optional, maybe redundant if they did the action themselves)
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, shopId, router]);

  return null;
}
