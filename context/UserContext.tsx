"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

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
  type: "order" | "promo" | "system";
  date: string;
  isRead: boolean;
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
  viewedProducts: Map<
    string,
    { product: any; shop: any; timestamp: number }
  >;
  loading: boolean;
  addAddress: (
    address: Omit<Address, "id">,
  ) => void;
  updateAddress: (
    id: string,
    address: Partial<Address>,
  ) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
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
  clearNotifications: () => void;
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
  signOut: () => Promise<void>;
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
    viewedProducts: new Map(),
    loading: true,
    addAddress: () => {},
    updateAddress: () => {},
    deleteAddress: () => {},
    setDefaultAddress: () => {},
    addPurchase: () => {},
    addNotification: () => {},
    clearNotifications: () => {},
    updatePurchaseStatus: () => {},
    updateShop: () => {},
    refreshSellerProducts: async () => {},
    refreshSellerOrders: async () => {},
    refreshHomeProducts: async () => {},
    refreshPurchases: async () => {},
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

  const resetState = () => {
    setAddresses([]);
    setPurchases([]);
    setNotifications([]);
    setShop(null);
    setShopId(null);
    setSellerProducts(null);
    setSellerOrders(null);
    setHomeProducts(null);
    setViewedProducts(new Map());
    setProfile(null);
  };
  const restoreState = async (
    userId: string | undefined,
    userEmail: string | undefined,
  ) => {
    setAddresses([
      {
        id: "1",
        label: "Home",
        firstName: "Juan",
        lastName: "Dela Cruz",
        address: "123 Malakas St, Brgy. Pinyahan",
        city: "Quezon City",
        postalCode: "1100",
        isDefault: true,
      },
    ]);
    setNotifications([
      {
        id: "1",
        title: "Welcome to ANEC Global!",
        message:
          "Complete your profile to get the most out of our shopping experience.",
        type: "system",
        date: new Date().toISOString(),
        isRead: false,
      },
    ]);

    // Fetch Profile for Role Check
    if (userId) {
      const { data: profileData, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

      if (error) {
        console.warn(
          "Profile fetch error:",
          error.message,
        );
      }

      if (profileData) {
        setProfile(profileData);
      } else {
        // If no profile exists, create a new one as 'customer'
        const {
          data: newProfile,
          error: insertError,
        } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              email: userEmail,
              role: "customer",
              full_name:
                userEmail?.split("@")[0] ||
                "User",
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error(
            "Error creating default profile:",
            insertError,
          );
          setProfile({ role: "customer" }); // Fallback to memory
        } else if (newProfile) {
          setProfile(newProfile);
        } else {
          setProfile({ role: "customer" });
        }
      }

      // Fetch Shop for Seller/Admin
      const { data: shopData } = await supabase
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
              .from("products")
              .select(
                "*, category:categories(name)",
              )
              .eq("shop_id", shopData.id)
              .order("created_at", {
                ascending: false,
              }),
            supabase
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
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        setUser(user);
        if (user) {
          await restoreState(user.id, user.email);
        } else {
          resetState();
        }
      } catch (error) {
        console.error(
          "Session fetch error:",
          error,
        );
      } finally {
        // Fetch home products regardless of session
        refreshHomeProducts().finally(() =>
          setLoading(false),
        );
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setUser(user);

        if (user) {
          await restoreState(user.id, user.email);
        } else {
          resetState();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const addAddress = (
    address: Omit<Address, "id">,
  ) => {
    const newAddress = {
      ...address,
      id: Math.random().toString(36).substr(2, 9),
    };
    setAddresses((prev) => [...prev, newAddress]);
  };

  const updateAddress = (
    id: string,
    updated: Partial<Address>,
  ) => {
    setAddresses((prev) =>
      prev.map((addr) =>
        addr.id === id
          ? { ...addr, ...updated }
          : addr,
      ),
    );
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) =>
      prev.filter((addr) => addr.id !== id),
    );
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    );
  };

  const addPurchase = (
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
  };

  const addNotification = (
    notification: Omit<
      Notification,
      "id" | "date" | "isRead"
    >,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [
      newNotification,
      ...prev,
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updatePurchaseStatus = (
    id: string,
    status: Purchase["status"],
  ) => {
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
  };

  const updateShop = (updates: any) => {
    setShop((prev: any) =>
      prev ? { ...prev, ...updates } : updates,
    );
    if (updates.id) setShopId(updates.id);
  };

  const refreshSellerProducts = async () => {
    if (!shopId) return;
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (data) setSellerProducts(data);
  };

  const refreshSellerOrders = async () => {
    if (!shopId) return;
    const { data } = await supabase
      .from("orders")
      .select(
        "*, customer:profiles(full_name, email)",
      )
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (data) setSellerOrders(data);
  };

  const refreshHomeProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("status", "active")
      .limit(12)
      .order("created_at", { ascending: false });
    if (data) setHomeProducts(data);
  };

  const refreshPurchases = async () => {
    if (!user?.id) return;
    const { data } = await supabase
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
      .order("created_at", { ascending: false });
    if (data) setPurchases(data as any);
  };

  const getProductFromCache = (
    productId: string,
  ) => {
    const cached = viewedProducts.get(productId);
    if (!cached) return null;
    return {
      product: cached.product,
      shop: cached.shop,
    };
  };

  const cacheProduct = (
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

      // Keep only the last 20 viewed products
      if (newCache.size > 20) {
        const oldestKey = Array.from(
          newCache.entries(),
        ).sort(
          (a, b) =>
            a[1].timestamp - b[1].timestamp,
        )[0][0];
        newCache.delete(oldestKey);
      }

      return newCache;
    });
  };

  const signOut = async () => {
    const toastId = toast.loading(
      "Logging you out...",
    );
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully", {
        id: toastId,
      });
      // Small delay to ensure the success toast is perceived before the hard reload
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      toast.error("Logout failed", {
        id: toastId,
      });
      console.error("Logout error:", error);
    }
  };

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
