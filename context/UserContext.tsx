"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { clockOutAction } from "@/app/actions/hr_attendance";

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Purchase {
  id: string;
  items: any[];
  total: number;
  status:
    | "to_pay"
    | "to_ship"
    | "to_receive"
    | "completed"
    | "cancelled"
    | "refund_pending"
    | "refunded";
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "order"
    | "promo"
    | "system"
    | "seller_approved";
  date: string;
  isRead: boolean;
}

export function formatTimeAgo(
  dateString: string,
) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000,
  );

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(
    diffInSeconds / 60,
  );
  if (diffInMinutes < 60)
    return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(
    diffInMinutes / 60,
  );
  if (diffInHours < 24)
    return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

type UserContextType = {
  user: User | null;
  profile: any | null;
  addresses: Address[];
  purchases: Purchase[];
  notifications: Notification[];
  shop: any | null;
  shopId: string | null;
  sellerProducts: any[] | null;
  sellerOrders: any[] | null;
  homeProducts: any[] | null;
  newArrivals: any[] | null;
  popularProducts: any[] | null;
  categories: any[] | null;
  refreshProfile: () => Promise<void>;
  viewedProducts: Map<
    string,
    { product: any; shop: any; timestamp: number }
  >;
  loading: boolean;
  addAddress: (
    address: Omit<Address, "id">,
  ) => Promise<void>;
  updateAddress: (
    id: string,
    address: Partial<Address>,
  ) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (
    id: string,
  ) => Promise<void>;
  addPurchase: (
    purchase: Omit<
      Purchase,
      "id" | "date" | "status"
    >,
  ) => void;
  addNotification: (
    notification: Omit<
      Notification,
      "id" | "date" | "isRead"
    >,
  ) => void;
  clearNotifications: () => Promise<void>;
  updatePurchaseStatus: (
    id: string,
    status: Purchase["status"],
  ) => void;
  updateShop: (updates: any) => void;
  refreshSellerProducts: () => Promise<void>;
  refreshSellerOrders: () => Promise<void>;
  refreshHomeProducts: () => Promise<void>;
  refreshPurchases: () => Promise<void>;
  getProductFromCache: (
    productId: string,
  ) => { product: any; shop: any } | null;
  cacheProduct: (
    productId: string,
    product: any,
    shop: any,
  ) => void;
  signOut: (force?: boolean) => Promise<void>;
};

const UserContext =
  createContext<UserContextType>({
    user: null,
    profile: null,
    addresses: [],
    purchases: [],
    notifications: [],
    shop: null,
    shopId: null,
    sellerProducts: null,
    sellerOrders: null,
    homeProducts: null,
    newArrivals: null,
    popularProducts: null,
    categories: null,
    viewedProducts: new Map(),
    loading: true,
    addAddress: async () => {},
    updateAddress: async () => {},
    deleteAddress: async () => {},
    setDefaultAddress: async () => {},
    addPurchase: () => {},
    addNotification: () => {},
    clearNotifications: async () => {},
    updatePurchaseStatus: () => {},
    updateShop: () => {},
    refreshSellerProducts: async () => {},
    refreshSellerOrders: async () => {},
    refreshHomeProducts: async () => {},
    refreshPurchases: async () => {},
    refreshProfile: async () => {},
    getProductFromCache: () => null,
    cacheProduct: () => {},
    signOut: async () => {},
  });

const supabase = createClient();

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(
    null,
  );
  const [profile, setProfile] = useState<
    any | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<
    Address[]
  >([]);
  const [purchases, setPurchases] = useState<
    Purchase[]
  >([]);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [shop, setShop] = useState<any | null>(
    null,
  );
  const [shopId, setShopId] = useState<
    string | null
  >(null);
  const [sellerProducts, setSellerProducts] =
    useState<any[] | null>(null);
  const [sellerOrders, setSellerOrders] =
    useState<any[] | null>(null);
  const [homeProducts, setHomeProducts] =
    useState<any[] | null>(null);
  const [newArrivals, setNewArrivals] = useState<
    any[] | null
  >(null);
  const [popularProducts, setPopularProducts] =
    useState<any[] | null>(null);
  const [categories, setCategories] = useState<
    any[] | null
  >(null);
  const [viewedProducts, setViewedProducts] =
    useState<
      Map<
        string,
        {
          product: any;
          shop: any;
          timestamp: number;
        }
      >
    >(new Map());

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const cachedProfile = localStorage.getItem(
        "cached_profile",
      );
      const cachedPurchases =
        localStorage.getItem("cached_purchases");
      const cachedHomeProducts =
        localStorage.getItem(
          "cached_homeProducts",
        );
      const cachedShop = localStorage.getItem(
        "cached_shop",
      );

      if (cachedProfile)
        setProfile(JSON.parse(cachedProfile));
      if (cachedPurchases)
        setPurchases(JSON.parse(cachedPurchases));
      if (cachedHomeProducts)
        setHomeProducts(
          JSON.parse(cachedHomeProducts),
        );
      if (cachedShop) {
        const shopData = JSON.parse(cachedShop);
        setShop(shopData);
        setShopId(shopData.id);
      }
    } catch (e) {
      // Silent error
    }
  }, []);

  // Save to cache whenever data changes
  useEffect(() => {
    if (profile)
      localStorage.setItem(
        "cached_profile",
        JSON.stringify(profile),
      );
  }, [profile]);

  useEffect(() => {
    if (shop)
      localStorage.setItem(
        "cached_shop",
        JSON.stringify(shop),
      );
  }, [shop]);

  useEffect(() => {
    if (purchases.length > 0)
      localStorage.setItem(
        "cached_purchases",
        JSON.stringify(purchases),
      );
  }, [purchases]);

  useEffect(() => {
    if (homeProducts && homeProducts.length > 0)
      localStorage.setItem(
        "cached_homeProducts",
        JSON.stringify(homeProducts),
      );
  }, [homeProducts]);

  const resetState = useCallback(() => {
    setAddresses([]);
    setPurchases([]);
    setNotifications([]);
    setShop(null);
    setShopId(null);
    setSellerProducts(null);
    setSellerOrders(null);
    setHomeProducts(null);
    setNewArrivals(null);
    setPopularProducts(null);
    setCategories(null);
    setViewedProducts(new Map());
    setProfile(null);
  }, []);

  const refreshSellerProducts =
    useCallback(async () => {
      if (!shopId) return;
      const { data } = await supabase
        .schema("bpm-anec-global")
        .from("products")
        .select(
          "*, product_category_links(category:categories(name))",
        )
        .eq("shop_id", shopId)
        .order("created_at", {
          ascending: false,
        });
      if (data) setSellerProducts(data);
    }, [shopId]);

  const refreshSellerOrders =
    useCallback(async () => {
      if (!shopId) return;
      const { data } = await supabase
        .schema("bpm-anec-global")
        .from("orders")
        .select(
          "*, customer:profiles(full_name, email)",
        )
        .eq("shop_id", shopId)
        .order("created_at", {
          ascending: false,
        });
      if (data) setSellerOrders(data);
    }, [shopId]);

  const refreshHomeProducts =
    useCallback(async () => {
      const [
        productsRes,
        newArrivalsRes,
        popularRes,
        categoriesRes,
      ] = await Promise.all([
        supabase
          .schema("bpm-anec-global")
          .from("products")
          .select(
            "*, product_category_links(category:categories(name))",
          )
          .eq("status", "active")
          .limit(12)
          .order("created_at", {
            ascending: false,
          }),
        supabase
          .schema("bpm-anec-global")
          .from("products")
          .select(
            "*, product_category_links(category:categories(name))",
          )
          .eq("status", "active")
          .gte(
            "created_at",
            new Date()
              .toISOString()
              .split("T")[0] + "T00:00:00Z",
          )
          .limit(8)
          .order("created_at", {
            ascending: false,
          }),
        supabase
          .schema("bpm-anec-global")
          .from("products")
          .select(
            "*, product_category_links(category:categories(name))",
          )
          .eq("status", "active")
          .gt("sales_count", 0)
          .limit(8)
          .order("sales_count", {
            ascending: false,
          }),
        supabase
          .schema("bpm-anec-global")
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (productsRes.data)
        setHomeProducts(productsRes.data);
      if (newArrivalsRes.data)
        setNewArrivals(newArrivalsRes.data);
      if (popularRes.data)
        setPopularProducts(popularRes.data);
      if (categoriesRes.data)
        setCategories(categoriesRes.data);
    }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data: profileData } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select(
        "*, roles(name), department:departments!profiles_department_id_fkey(id, name, code)",
      )
      .eq("id", user.id)
      .single();

    if (profileData) {
      // Map roles.name to role for backward compatibility
      if ((profileData as any).roles) {
        (profileData as any).role = (
          profileData as any
        ).roles.name;
      }
      setProfile(profileData);
      localStorage.setItem(
        "cached_profile",
        JSON.stringify(profileData),
      );

      // Also refresh shop if approved
      if (profileData.role === "seller") {
        const { data: shopData } = await supabase
          .schema("bpm-anec-global")
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (shopData) {
          setShop(shopData);
          setShopId(shopData.id);
          localStorage.setItem(
            "cached_shop",
            JSON.stringify(shopData),
          );
        }
      }
    }
  }, [user?.id]);

  const refreshAddresses =
    useCallback(async (userId?: string) => {
      const activeUserId = userId || user?.id;
      if (!activeUserId) return;
      const { data, error } = await supabase
        .schema("bpm-anec-global")
        .from("addresses")
        .select("*")
        .eq("user_id", activeUserId)
        .order("created_at", {
          ascending: false,
        });

      if (data) {
        setAddresses(
          data.map((addr: any) => ({
            id: addr.id,
            label: addr.label,
            firstName: addr.first_name,
            lastName: addr.last_name,
            address: addr.address,
            city: addr.city,
            postalCode: addr.postal_code,
            isDefault: addr.is_default,
          })),
        );
      }
    }, [user?.id]);

  const refreshPurchases =
    useCallback(async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .schema("bpm-anec-global")
        .from("orders")
        .select(
          `
                *,
                shops(name),
                order_items (
                    id,
                    product_name,
                    product_image,
                    product_category,
                    quantity,
                    price_at_purchase
                )
            `,
        )
        .eq("customer_id", user.id)
        .order("created_at", {
          ascending: false,
        });
      if (data) setPurchases(data as any);
    }, [user?.id]);

  const restoreState = useCallback(
    async (
      userId: string | undefined,
      userEmail: string | undefined,
    ) => {
      // Mock Data Removed - Fetching real addresses instead
      if (userId) {
        refreshAddresses(userId);
      }

      // Fetch Notifications
      const { data: notificationsData } =
        await supabase
          .schema("bpm-anec-global")
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", {
            ascending: false,
          });

      if (notificationsData) {
        // Filter out performance evaluations for normal customers
        // Roles that SHOULD see them: admin, hr*, log*, finance
        const filtered = notificationsData.filter(
          (n) => {
            const isHRNotif = n.title
              .toLowerCase()
              .includes("performance evaluation");
            if (!isHRNotif) return true;

            const allowedRoles = [
              "admin",
              "hr1",
              "hr2",
              "hr3",
              "hr4",
              "log1",
              "log2",
              "finance",
            ];
            const userRole =
              profile?.role?.toLowerCase() || "";

            return allowedRoles.includes(
              userRole,
            );
          },
        );
        setNotifications(filtered);
      } else {
        setNotifications([]);
      }

      // Fetch Profile for Role Check
      if (userId) {
        const { data: profileData, error } =
          await supabase
            .schema("bpm-anec-global")
            .from("profiles")
            .select(
              "*, roles(name), department:departments!profiles_department_id_fkey(id, name, code)",
            )
            .eq("id", userId)
            .single();

        if (profileData) {
          // Map roles.name to role for backward compatibility
          if ((profileData as any).roles) {
            (profileData as any).role = (
              profileData as any
            ).roles.name;
          }
          setProfile(profileData);
        }

        // Fetch Shop for Seller/Admin
        const { data: shopData } = await supabase
          .schema("bpm-anec-global")
          .from("shops")
          .select("*")
          .eq("owner_id", userId)
          .single();

        if (shopData) {
          setShop(shopData);
          setShopId(shopData.id);

          // Fetch Products and Orders for the shop
          const [productsRes, ordersRes] =
            await Promise.all([
              supabase
                .schema("bpm-anec-global")
                .from("products")
                .select(
                  "*, product_category_links(category:categories(name))",
                )
                .eq("shop_id", shopData.id)
                .order("created_at", {
                  ascending: false,
                }),
              supabase
                .schema("bpm-anec-global")
                .from("orders")
                .select(
                  "*, customer:profiles(full_name, email)",
                )
                .eq("shop_id", shopData.id)
                .order("created_at", {
                  ascending: false,
                }),
            ]);

          if (productsRes.data)
            setSellerProducts(productsRes.data);
          if (ordersRes.data)
            setSellerOrders(ordersRes.data);
        }

        // Fetch User Purchases
        const { data: purchasesData } =
          await supabase
            .schema("bpm-anec-global")
            .from("orders")
            .select(
              `
                      *,
                      shops(name),
                      order_items (
                          id,
                          product_name,
                          product_image,
                          product_category,
                          quantity,
                          price_at_purchase
                      )
                  `,
            )
            .eq("customer_id", userId)
            .order("created_at", {
              ascending: false,
            });

        if (purchasesData)
          setPurchases(purchasesData as any);
      }
    },
    [],
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION"
        ) {
          const user = session?.user ?? null;
          setUser(user);

          if (user) {
            // Background refresh without blocking loading
            restoreState(user.id, user.email);
          } else {
            resetState();
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          resetState();
          setLoading(false);
        }
      },
    );

    const getSessionFallback = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && !user) {
          setUser(session.user);
          // Background refresh without blocking loading
          restoreState(
            session.user.id,
            session.user.email,
          );
        }
      } catch (e) {
        // Error
      } finally {
        // Stop spinner once we've at least checked the session
        setLoading(false);
      }

      // Real-time logic moved to separate useEffect for better management
      return () => {};
    };

    // Safety timeout: stop spinner after 5s no matter what
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    getSessionFallback();

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [restoreState]);

  // Real-time subscriptions for notifications and orders
  useEffect(() => {
    if (!user?.id) return;

    // 1. Notification Channel (Personal notifications for alerts)
    const notificationChannel = supabase
      .channel(
        `personal-notifications-${user.id}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "bpm-anec-global",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Normalize notification data
          const newNotif = {
            ...payload.new,
            date: payload.new.created_at,
            isRead: payload.new.is_read,
          } as any;

          // Deduplicate based on ID to prevent race conditions
          setNotifications((prev) => {
            const isHRNotif = newNotif.title
              .toLowerCase()
              .includes("performance evaluation");
            if (isHRNotif) return prev;

            const exists = prev.some(
              (n) => n.id === newNotif.id,
            );
            if (exists) return prev;
            return [newNotif, ...prev];
          });

          // Visual Alert
          toast.info(payload.new.title, {
            description: `${payload.new.message} • ${formatTimeAgo(
              payload.new.created_at,
            )}`,
            action: {
              label: "View",
              onClick: () => {
                if (
                  payload.new.type === "order"
                ) {
                  if (
                    profile?.role === "seller"
                  ) {
                    router.push(
                      "/core/transaction2/seller/returns",
                    );
                  } else {
                    router.push(
                      "/core/transaction1/purchases",
                    );
                  }
                } else if (
                  payload.new.type ===
                  "seller_approved"
                ) {
                  router.push(
                    "/core/transaction2/seller",
                  );
                }
              },
            },
          });

          // Trigger data refreshes if needed based on type
          if (
            payload.new.type === "seller_approved"
          ) {
            refreshProfile();
          }
          if (payload.new.type === "order") {
            refreshPurchases();
          }
        },
      )
      .subscribe();

    // 2. Order Updates Channel (As a customer - tracking status)
    // Removed specific filter to solve potential filter string mismatch issues
    // Security is handled by Supabase RLS policies
    const customerOrderChannel = supabase
      .channel(`customer-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "bpm-anec-global",
          table: "orders",
        },
        (payload) => {
          // Only act if this is the customer's order
          if (payload.new.customer_id !== user.id)
            return;

          refreshPurchases();
          // Visual alert is handled by notificationChannel
        },
      )
      .subscribe();

    // 3. Seller Channel (Receiving new orders)
    let sellerChannel: any = null;
    if (shopId) {
      sellerChannel = supabase
        .channel(`seller-orders-${shopId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "bpm-anec-global",
            table: "orders",
          },
          (payload) => {
            // Only act if this is the seller's shop
            if (payload.new.shop_id !== shopId)
              return;

            refreshSellerOrders();
            toast.success("New Order Received!", {
              description: `Total: ${payload.new.total_amount.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 0,
                },
              )}`,
              action: {
                label: "Confirm",
                onClick: () =>
                  router.push(
                    `/core/transaction2/seller/orders/${payload.new.id}`,
                  ),
              },
            });
          },
        )
        .subscribe();
    }

    return () => {
      notificationChannel.unsubscribe();
      customerOrderChannel.unsubscribe();
      if (sellerChannel)
        sellerChannel.unsubscribe();
    };
  }, [
    user?.id,
    shopId,
    refreshProfile,
    refreshPurchases,
    refreshSellerOrders,
  ]);

  // Revalidate on window focus for safety
  useEffect(() => {
    const onFocus = () => {
      if (user?.id) {
        refreshPurchases();
        if (shopId) {
          refreshSellerOrders();
          refreshSellerProducts();
        }
      }
      refreshHomeProducts();
    };

    window.addEventListener("focus", onFocus);
    return () =>
      window.removeEventListener(
        "focus",
        onFocus,
      );
  }, [
    user?.id,
    shopId,
    refreshPurchases,
    refreshSellerOrders,
    refreshSellerProducts,
    refreshHomeProducts,
  ]);

  const addAddress = useCallback(
    async (address: Omit<Address, "id">) => {
      if (!user?.id) return;

      const isFirst = addresses.length === 0;
      const shouldBeDefault =
        isFirst || address.isDefault;

      // If this address should be default, reset others in DB first
      if (shouldBeDefault) {
        await supabase
          .schema("bpm-anec-global")
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .schema("bpm-anec-global")
        .from("addresses")
        .insert({
          user_id: user.id,
          label: address.label,
          first_name: address.firstName,
          last_name: address.lastName,
          address: address.address,
          city: address.city,
          postal_code: address.postalCode,
          is_default: shouldBeDefault,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to add address");
        console.error(
          "Add address error:",
          error,
        );
      } else {
        toast.success(
          "Address added successfully",
        );
        refreshAddresses();
      }
    },
    [
      user?.id,
      addresses.length,
      refreshAddresses,
    ],
  );

  const updateAddress = useCallback(
    async (
      id: string,
      updated: Partial<Address>,
    ) => {
      if (!user?.id) return;

      // If setting to default, reset others first
      if (updated.isDefault) {
        await supabase
          .schema("bpm-anec-global")
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("addresses")
        .update({
          label: updated.label,
          first_name: updated.firstName,
          last_name: updated.lastName,
          address: updated.address,
          city: updated.city,
          postal_code: updated.postalCode,
          is_default: updated.isDefault,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to update address");
        console.error(
          "Update address error:",
          error,
        );
      } else {
        refreshAddresses();
      }
    },
    [user?.id, refreshAddresses],
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      const addressToDelete = addresses.find(
        (a) => a.id === id,
      );

      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to delete address");
        console.error(
          "Delete address error:",
          error,
        );
      } else {
        toast.success("Address deleted");

        // If we deleted the default address and have others left,
        // set the most recent one as default
        if (
          addressToDelete?.isDefault &&
          addresses.length > 1
        ) {
          const remainingAddresses =
            addresses.filter((a) => a.id !== id);
          if (remainingAddresses.length > 0) {
            await setDefaultAddress(
              remainingAddresses[0].id,
            );
          }
        } else {
          refreshAddresses();
        }
      }
    },
    [user?.id, addresses, refreshAddresses],
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      // 1. Reset all others to false
      await supabase
        .schema("bpm-anec-global")
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // 2. Set the target to true
      const { error } = await supabase
        .schema("bpm-anec-global")
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Set default address error:",
          error,
        );
      } else {
        refreshAddresses();
      }
    },
    [user?.id, refreshAddresses],
  );

  const addNotification = useCallback(
    (
      notification: Omit<
        Notification,
        "id" | "date" | "isRead"
      >,
    ) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random()
          .toString(36)
          .substr(2, 9),
        date: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [
        newNotification,
        ...prev,
      ]);
    },
    [],
  );

  const clearNotifications =
    useCallback(async () => {
      if (!user?.id) return;
      setNotifications([]);
      try {
        await supabase
          .schema("bpm-anec-global")
          .from("notifications")
          .delete()
          .eq("user_id", user.id);
      } catch (error) {
        console.error(
          "Error clearing notifications:",
          error,
        );
      }
    }, [user?.id]);

  const addPurchase = useCallback(
    (
      purchase: Omit<
        Purchase,
        "id" | "date" | "status"
      >,
    ) => {
      const newPurchase: Purchase = {
        ...purchase,
        id:
          "ORD-" +
          Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase(),
        date: new Date().toISOString(),
        status: "to_pay",
      };
      setPurchases((prev) => [
        newPurchase,
        ...prev,
      ]);

      // Add a notification too
      addNotification({
        title: "Order Placed",
        message: `Your order ${newPurchase.id} has been placed successfully.`,
        type: "order",
      });
    },
    [addNotification],
  );

  const updatePurchaseStatus = useCallback(
    (id: string, status: Purchase["status"]) => {
      setPurchases((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status } : p,
        ),
      );

      if (status === "cancelled") {
        addNotification({
          title: "Order Cancelled",
          message: `Your order ${id} has been cancelled.`,
          type: "order",
        });
      }
    },
    [addNotification],
  );

  const updateShop = useCallback(
    (updates: any) => {
      setShop((prev: any) =>
        prev ? { ...prev, ...updates } : updates,
      );
      if (updates.id) setShopId(updates.id);
    },
    [],
  );

  const getProductFromCache = useCallback(
    (productId: string) => {
      const cached =
        viewedProducts.get(productId);
      if (!cached) return null;
      return {
        product: cached.product,
        shop: cached.shop,
      };
    },
    [viewedProducts],
  );

  const cacheProduct = useCallback(
    (
      productId: string,
      product: any,
      shop: any,
    ) => {
      setViewedProducts((prev) => {
        const newCache = new Map(prev);
        newCache.set(productId, {
          product,
          shop,
          timestamp: Date.now(),
        });

        if (newCache.size > 20) {
          const oldestEntry = Array.from(
            newCache.entries(),
          ).sort(
            (a, b) =>
              a[1].timestamp - b[1].timestamp,
          )[0];
          if (oldestEntry) {
            newCache.delete(oldestEntry[0]);
          }
        }

        return newCache;
      });
    },
    [],
  );

  const signOut = useCallback(async (force?: boolean) => {
    // Determine the user role
    const profileData = profile as any;
    const profileRole =
      profileData?.roles?.name ||
      profileData?.role ||
      "";
    const isEmployee =
      profileRole &&
      ![
        "customer",
        "seller",
      ].includes(
        profileRole.toLowerCase(),
      );

    if (isEmployee) {
      // Check if it's out time
      const checkShift = async () => {
        const today = new Date().toISOString().split("T")[0];
        const { data: shift } = await supabase
          .from("shift_schedule_management")
          .select("*")
          .eq("employee_id", profileData.id)
          .gte("start_time", `${today}T00:00:00Z`)
          .lte("start_time", `${today}T23:59:59Z`)
          .maybeSingle();

        if (
          shift &&
          new Date() < new Date(shift.end_time)
        ) {
          return {
            isEarly: true,
            endTime: new Date(
              shift.end_time,
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        }
        return { isEarly: false };
      };

      const shiftInfo = await checkShift();
      if (shiftInfo.isEarly) {
        toast.error("Sign Out Restricted", {
          description: `It is not yet your out time. Your shift ends at ${shiftInfo.endTime}. Please stay logged in until then.`,
          duration: 5000,
        });
        return;
      }

      const performSignOut = async () => {
        setLoading(true);
        try {
          // Sync Attendance: Clock out server-side if online
          await clockOutAction(profileData.id);

          resetState();
          localStorage.removeItem("cached_profile");
          localStorage.removeItem("cached_purchases");
          localStorage.removeItem("cached_homeProducts");
          localStorage.removeItem("cached_shop");

          await supabase.auth.signOut();

          toast.success("Logged out successfully");

          // Force Google Logout for employees
          const landingPage = window.location.origin;
          window.location.href = `https://accounts.google.com/Logout?continue=${encodeURIComponent(
            landingPage,
          )}`;
        } catch (error) {
          console.error("Sign out error:", error);
          window.location.href = "/";
        } finally {
          setLoading(false);
        }
      };

      if (force === true) {
        await performSignOut();
        return;
      }

      // High security logout for employees
      toast("Sign Out Confirmation", {
        description:
          "Are you sure you want to sign out? This will also clear your Google session for security.",
        action: {
          label: "Sign Out",
          onClick: performSignOut,
        },
        cancel: {
          label: "Cancel",
          onClick: () => {},
        },
      });
    } else {
      const performSimpleSignOut = async () => {
        setLoading(true);
        try {
          resetState();
          localStorage.removeItem("cached_profile");
          localStorage.removeItem("cached_purchases");
          localStorage.removeItem("cached_homeProducts");
          localStorage.removeItem("cached_shop");

          await supabase.auth.signOut();

          toast.success("Logged out successfully");
          window.location.href = "/";
        } catch (error) {
          console.error("Sign out error:", error);
          window.location.href = "/";
        } finally {
          setLoading(false);
        }
      };

      if (force === true) {
        await performSimpleSignOut();
        return;
      }

      // Simple logout for customers and sellers
      toast("Confirm Sign Out", {
        description:
          "Are you sure you want to log out of your account?",
        action: {
          label: "Log out",
          onClick: performSimpleSignOut,
        },
        cancel: {
          label: "Cancel",
          onClick: () => {},
        },
      });
    }
  }, [profile, resetState, supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        addresses,
        purchases,
        notifications,
        shop,
        shopId,
        sellerProducts,
        sellerOrders,
        homeProducts,
        newArrivals,
        popularProducts,
        categories,
        viewedProducts,
        loading,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        addPurchase,
        addNotification,
        clearNotifications,
        updatePurchaseStatus,
        updateShop,
        refreshSellerProducts,
        refreshSellerOrders,
        refreshHomeProducts,
        refreshPurchases,
        refreshProfile,
        getProductFromCache,
        cacheProduct,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
