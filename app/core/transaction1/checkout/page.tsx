"use client";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Wallet,
  Landmark,
  ArrowLeft,
  CheckCircle2,
  Package,
  ShieldCheck,
  MapPin,
  ChevronDown,
  Coins,
  Truck as TruckIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useState,
  useEffect,
  Suspense,
} from "react";
import {
  useCart,
  CartItem,
} from "@/context/CartContext";
import {
  useUser,
  Address,
} from "@/context/UserContext";
import { useAuthGuard } from "@/utils/auth-guard";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");
  const {
    cartItems,
    totalAmount,
    removeSelectedItems,
    clearCart,
    updateQuantity,
  } = useCart();
  const { addresses, addPurchase } = useUser();
  const { protectAction } = useAuthGuard();
  const [isOrdered, setIsOrdered] =
    useState(false);
  const [checkoutItems, setCheckoutItems] =
    useState<any[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] =
    useState(true);
  const [selectedAddress, setSelectedAddress] =
    useState<Address | null>(
      addresses.find((a) => a.isDefault) ||
        addresses[0] ||
        null,
    );
  const [showAddressList, setShowAddressList] =
    useState(false);
  const [usePoints, setUsePoints] =
    useState(false);
  const [userPoints, setUserPoints] = useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState("cod");
  const [couriers, setCouriers] = useState<any[]>(
    [],
  );
  const [selectedCourier, setSelectedCourier] =
    useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const isAllowed = await protectAction(
        window.location.pathname + window.location.search,
      );
      if (!isAllowed) return;
      setIsCheckingAuth(false);

      // Fetch loyalty points
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .select("loyalty_points")
          .eq("id", user.id)
          .single();
        if (profile)
          setUserPoints(Number(profile.loyalty_points) || 0);
      }
    };
    checkAuth();
  }, [protectAction]);

  useEffect(() => {
    async function loadCheckoutItems() {
      if (productId) {
        // Fetch product from Supabase
        try {
          const { data: product, error } = await supabase
            .schema("bpm-anec-global")
            .from("products")
            .select(
              `
                            *,
                            product_category_links(category:categories(name))
                        `,
            )
            .eq("id", productId)
            .eq("status", "active")
            .single();

          if (error) throw error;

          if (product) {
            setCheckoutItems([
              {
                ...product,
                quantity: 1,
                category:
                  product.product_category_links
                    ?.map((l: any) => l.category?.name)
                    .filter(Boolean)
                    .join(", ") || "Uncategorized",
              },
            ]);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      } else {
        const selected = cartItems.filter((item) => item.selected);
        setCheckoutItems(selected);
      }
    }
    loadCheckoutItems();
  }, [productId, cartItems]);

  // Effect to sync selectedAddress with addresses from context
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      setSelectedAddress(
        addresses.find((a) => a.isDefault) ||
          addresses[0],
      );
    } else if (
      selectedAddress &&
      !addresses.some((a) => a.id === selectedAddress.id)
    ) {
      // If the currently selected address is no longer in the list,
      // select a new default or the first one.
      setSelectedAddress(
        addresses.find((a) => a.isDefault) ||
          addresses[0] ||
          null,
      );
    }
  }, [addresses, selectedAddress]);

  // Fetch couriers for the shop once checkout items are loaded
  useEffect(() => {
    async function loadCouriers() {
      const shopId = checkoutItems[0]?.shop_id;
      if (!shopId) return;

      // Get enabled providers for this shop
      const { data: settings } = await supabase
        .from("shop_logistics_settings")
        .select(
          "provider_id, logistics_providers!inner(id, name, is_active)",
        )
        .eq("shop_id", shopId)
        .eq("is_enabled", true);

      if (settings && settings.length > 0) {
        const providers = settings
          .map((s: any) => s.logistics_providers)
          .filter(Boolean);
        setCouriers(providers);
        if (providers.length > 0)
          setSelectedCourier(providers[0].id);
      } else {
        // Fallback: get only platform default active providers
        const { data: defaultProviders } =
          await supabase
            .from("logistics_providers")
            .select("*")
            .eq("is_active", true)
            .eq("is_default", true);
        if (
          defaultProviders &&
          defaultProviders.length > 0
        ) {
          setCouriers(defaultProviders);
          setSelectedCourier(
            defaultProviders[0].id,
          );
        }
      }
    }
    if (checkoutItems.length > 0) loadCouriers();
  }, [checkoutItems]);

  if (isCheckingAuth) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 mx-auto rounded"></div>
          <p className="text-slate-400">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0 && !isOrdered) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
        <div className="bg-slate-100 p-8 rounded-full">
          <ShoppingBag className="h-16 w-16 text-slate-300" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Your checkout is empty
        </h1>
        <p className="text-slate-500 max-w-sm">
          Please select items from your cart
          before proceeding to checkout.
        </p>
        <Button
          size="lg"
          className="bg-primary text-black font-bold h-14 px-10 rounded-2xl"
          onClick={() => router.push("/")}
        >
          Go Shopping
        </Button>
      </div>
    );
  }

  const subtotal = checkoutItems.reduce(
    (acc, item) =>
      acc + item.price * item.quantity,
    0,
  );

  const isFreeShipping = false; // Voucher logic removed
  const shipping =
    subtotal > 0 ? (isFreeShipping ? 0 : 36) : 0; // Fixed to 36 pesos
  const discount = 0; // Voucher logic removed
  const tax = 0; // Removed taxes
  // Points deduction: 1 point = ₱1, capped at 40% of subtotal after discount
  const maxPointsDeduction = Math.min(
    userPoints,
    Math.floor((subtotal - discount) * 0.4),
  );
  const pointsDeduction = usePoints
    ? maxPointsDeduction
    : 0;
  const total =
    subtotal +
    shipping +
    tax -
    discount -
    pointsDeduction;

  const formatDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const deliveryDate = formatDate(3); // Standardized delivery time estimate


  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error(
        "Please select a shipping address",
      );
      return;
    }

    if (couriers.length > 0 && !selectedCourier) {
      toast.error(
        "Please select a shipping courier",
      );
      return;
    }

    const toastId = toast.loading(
      "Placing your order...",
    );
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error(
          "Please log in to place an order",
          { id: toastId },
        );
        return;
      }

      // Get shop_id from first item (assuming single-shop checkout)
      const shopId =
        checkoutItems[0]?.shop_id || null;

      // Ensure profile exists using Server Action
      const { ensureProfile } =
        await import("@/app/actions/checkout");
      const profileResult = await ensureProfile(
        user.id,
        user.email || "",
        user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User",
      );

      if (!profileResult.success) {
        toast.error(
          `Failed to initialize user profile: ${profileResult.error}`,
          { id: toastId },
        );
        return;
      }

      // 1. Create the order
      const { data: order, error: orderError } =
        await supabase
          .schema("bpm-anec-global")
          .from("orders")
          .insert({
            customer_id: user.id,
            shop_id: shopId,
            total_amount: total,
            status: "to_pay",
            payment_status: "pending",
            shipping_status: "pending",
            shipping_address: `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.postalCode}`,
            payment_method: paymentMethod,
            shipping_fee: shipping,
            tax_amount: tax,
            discount_amount: discount,
            courier_id: selectedCourier,
            points_deduction_amount:
              pointsDeduction,
          })
          .select()
          .single();

      if (orderError) {
        console.error(
          "Order creation error:",
          orderError,
        );
        throw orderError;
      }

      // 2. Create order items
      const orderItems = checkoutItems.map(
        (item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price,
          product_name: item.name,
          product_image:
            item.images?.[0] || item.image,
          product_category: item.category,
          shop_id: shopId,
        }),
      );

      const { error: itemsError } = await supabase
        .schema("bpm-anec-global")
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error(
          "Order items error:",
          itemsError,
        );
        throw itemsError;
      }

      // 2.5. Subtract stock for each item
      for (const item of checkoutItems) {
        console.log(
          `Decrementing stock for ${item.name} (${item.id}) by ${item.quantity}`,
        );
        const { error: stockError } =
          await supabase
            .schema("bpm-anec-global")
            .rpc("decrement_stock", {
              product_id: item.id,
              qty: item.quantity,
            });

        if (stockError) {
          console.error(
            "Stock decrement error:",
            stockError,
          );
        } else {
          console.log(
            `Successfully decremented stock for ${item.name}`,
          );
        }

        // Increment sales_count
        await supabase
          .schema("bpm-anec-global")
          .rpc("increment_sales", {
            product_id: item.id,
            qty: item.quantity,
          });
      }

      // 2.6. Deduct loyalty points if used
      if (pointsDeduction > 0) {
        await supabase
          .schema("bpm-anec-global")
          .from("profiles")
          .update({
            loyalty_points:
              userPoints - pointsDeduction,
          })
          .eq("id", user.id);

        await supabase
          .schema("bpm-anec-global")
          .from("loyalty_point_transactions")
          .insert({
            user_id: user.id,
            points: -pointsDeduction,
            type: "deduction",
            description: `Used ${pointsDeduction} points on order #${order.id.slice(0, 8)}`,
            order_id: order.id,
          });
      }

      // 3. Clear cart or remove selected items
      if (productId) {
        // Single product checkout - no cart to clear
      } else {
        removeSelectedItems();
      }

      // 4. Create notification for the seller
      const { data: shopOwner } = await supabase
        .from("shops")
        .select("owner_id")
        .eq("id", shopId)
        .single();

      if (shopOwner?.owner_id) {
        await supabase
          .schema("bpm-anec-global")
          .from("notifications")
          .insert({
            user_id: shopOwner.owner_id,
            title: "New Order Received!",
            message: `You have received a new order (${order.id.slice(0, 8)}...) for ${checkoutItems.length} item(s).`,
            type: "order",
            is_read: false,
          });
      }

      toast.success(
        "Order placed successfully!",
        {
          id: toastId,
          duration: 3000,
        },
      );

      // Slight delay so the success screen doesn't immediately
      // wipe the UI, allowing toasts to stack up elegantly
      setTimeout(() => {
        setIsOrdered(true);
      }, 1500);
    } catch (error) {
      console.error(
        "Error placing order:",
        error,
      );
      toast.error(
        "Failed to place order. Please try again.",
        { id: toastId },
      );
    }
  };

  if (isOrdered) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
        <div className="bg-green-100 p-6 rounded-full text-green-600">
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-black text-slate-900">
          Order Placed Successfully!
        </h1>
        <p className="text-slate-600 max-w-md">
          Thank you for your purchase. Your order
          has been placed and is being processed
          via{" "}
          <span className="font-bold text-primary uppercase">
            {paymentMethod}
          </span>
          . Expected delivery by{" "}
          <span className="font-bold text-slate-900">
            {deliveryDate}
          </span>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="bg-primary text-black font-bold h-14 px-10 rounded-2xl"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="font-bold h-14 px-10 rounded-2xl border-slate-200"
            onClick={() =>
              router.push(
                "/core/transaction1/purchases",
              )
            }
          >
            View My Purchase
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1200px]">
      <Link
        href={
          productId
            ? `/core/transaction1/product/${productId}`
            : "/"
        }
        className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 mb-8"
      >
        <ArrowLeft className="mr-2 h-3 w-3" />{" "}
        Back to Product
      </Link>

      <h1 className="text-2xl font-black mb-8 uppercase tracking-tighter">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Expected Delivery at Top */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-none">
            <Truck className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                Expected Delivery
              </p>
              <p className="text-sm font-bold text-slate-700">
                {deliveryDate}{" "}
                <span className="text-[10px] font-medium text-slate-400 ml-2 italic">
                  * Subject to weather and traffic
                  conditions
                </span>
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <Card className="border border-slate-200 bg-white rounded-lg overflow-hidden shadow-none">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-lg font-black">
                    Shipping Address
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setShowAddressList(
                      !showAddressList,
                    )
                  }
                  className="text-primary font-bold h-8 gap-1 rounded-lg hover:bg-primary/5"
                >
                  {selectedAddress
                    ? "Change"
                    : "Select"}{" "}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showAddressList &&
                        "rotate-180",
                    )}
                  />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {showAddressList ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setShowAddressList(false);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all group",
                        selectedAddress?.id ===
                          addr.id
                          ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(255,193,7,0.1)]"
                          : "border-slate-100 hover:border-slate-200",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">
                              {addr.firstName}{" "}
                              {addr.lastName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              ({addr.label})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {addr.address},{" "}
                            {addr.city},{" "}
                            {addr.postalCode}
                          </p>
                        </div>
                        {selectedAddress?.id ===
                          addr.id && (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="h-2.5 w-2.5 text-black" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <Button
                    onClick={() =>
                      router.push(
                        "/core/transaction1/profile?tab=address",
                      )
                    }
                    variant="outline"
                    className="w-full h-11 rounded-lg border-dashed border-2 font-bold opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Manage Addresses
                  </Button>
                </div>
              ) : selectedAddress ? (
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">
                        {
                          selectedAddress.firstName
                        }{" "}
                        {selectedAddress.lastName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                        {selectedAddress.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {selectedAddress.address},{" "}
                      {selectedAddress.city},{" "}
                      {selectedAddress.postalCode}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground font-medium mb-4">
                    No shipping address selected
                  </p>
                  <Button
                    onClick={() =>
                      setShowAddressList(true)
                    }
                    variant="outline"
                    className="rounded-lg font-bold"
                  >
                    Select an Address
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items (Product List) - Moved here */}
          <Card className="border border-slate-200 bg-white rounded-lg overflow-hidden shadow-none">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-lg font-black">
                  Order Items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {checkoutItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-6 hover:bg-slate-50/30 transition-colors"
                  >
                    <div className="h-14 w-14 flex items-center justify-center rounded-lg font-black text-sm bg-slate-900 text-white hover:bg-black transition-all shadow-none flex-shrink-0 overflow-hidden">
                      {item.image ||
                      (item.images &&
                        item.images.length >
                          0) ? (
                        <img
                          src={
                            item.images &&
                            item.images.length > 0
                              ? item.images[0]
                              : item.image
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.name
                          .substring(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tighter opacity-80">
                        {item.category}
                      </p>
                      <p className="font-black text-xs text-slate-950 mt-1">
                        {item.price.toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                          },
                        )}
                      </p>
                    </div>

                    {/* Item Quantity Controller */}
                    <div className="flex items-center gap-3 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                      <button
                        onClick={() => {
                          if (productId) {
                            const newItems = [
                              ...checkoutItems,
                            ];
                            newItems[0].quantity =
                              Math.max(
                                1,
                                newItems[0]
                                  .quantity - 1,
                              );
                            setCheckoutItems(
                              newItems,
                            );
                          } else {
                            updateQuantity(
                              item.id,
                              -1,
                            );
                          }
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-50"
                        disabled={
                          item.quantity <= 1
                        }
                      >
                        <span className="text-lg font-black leading-none">
                          -
                        </span>
                      </button>
                      <span className="text-xs font-black w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (productId) {
                            const newItems = [
                              ...checkoutItems,
                            ];
                            newItems[0].quantity += 1;
                            setCheckoutItems(
                              newItems,
                            );
                          } else {
                            updateQuantity(
                              item.id,
                              1,
                            );
                          }
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all"
                      >
                        <span className="text-lg font-black leading-none">
                          +
                        </span>
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Item Subtotal
                      </p>
                      <p className="font-black text-sm text-slate-900">
                        {(
                          item.price *
                          item.quantity
                        ).toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Right Sidebar */}
          <Card className="border-slate-100 bg-white rounded-lg shadow-none overflow-hidden h-fit">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Payment Method - Moved here */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                  Payment Method
                </Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-1 gap-2"
                >
                  <div className="relative group">
                    <RadioGroupItem
                      value="cod"
                      id="cod"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="cod"
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all h-14 cursor-pointer",
                        paymentMethod === "cod"
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-100 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                          <Wallet className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-xs">
                          COD
                        </span>
                      </div>
                      <div
                        className={cn(
                          "h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-all bg-white",
                          paymentMethod === "cod"
                            ? "border-primary"
                            : "border-slate-200",
                        )}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full bg-primary transition-opacity",
                            paymentMethod === "cod"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Courier Selection */}
              {couriers.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    Shipping Courier
                  </Label>
                  <RadioGroup
                    value={selectedCourier || ""}
                    onValueChange={setSelectedCourier}
                    className="grid grid-cols-1 gap-2"
                  >
                    {couriers.map((courier: any) => (
                      <div
                        key={courier.id}
                        className="relative group"
                      >
                        <RadioGroupItem
                          value={courier.id}
                          id={`courier-${courier.id}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`courier-${courier.id}`}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all h-14 cursor-pointer",
                            selectedCourier === courier.id
                              ? "border-slate-900 bg-slate-50"
                              : "border-slate-100 hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-all">
                              <TruckIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-bold text-xs">
                              {courier.name}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-all bg-white",
                              selectedCourier === courier.id
                                ? "border-primary"
                                : "border-slate-200",
                            )}
                          >
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full bg-primary transition-opacity",
                                selectedCourier === courier.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">
                    Subtotal
                  </span>
                  <span>
                    {subtotal.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">
                    Shipping Fee
                  </span>
                  {isFreeShipping ? (
                    <span className="text-green-600 font-bold uppercase text-[10px]">
                      Free Shipping
                    </span>
                  ) : (
                    <span>
                      {shipping.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-green-600">
                    <span>Discount</span>
                    <span>
                      -{" "}
                      {discount.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium border-t border-dashed pt-2 mt-2">
                  <span className="text-muted-foreground">
                    Total
                  </span>
                  <span className="font-black">
                    {total.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 p-4">
        <div className="container mx-auto flex justify-end max-w-6xl">
          {/* Section: Anec Points + Total + Place Order */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* Anec Points Section */}
            {userPoints > 0 ? (
              <button
                onClick={() => setUsePoints(!usePoints)}
                className={cn(
                  "w-full md:w-48 flex items-center justify-between p-3 rounded-lg border transition-all h-14",
                  usePoints
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-100 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                    <Coins className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-[10px] block uppercase leading-none mb-1">
                      {maxPointsDeduction} Points
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block leading-none">
                      -₱{maxPointsDeduction}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "h-4 w-7 rounded-full flex items-center transition-all px-0.5",
                    usePoints
                      ? "bg-slate-900 justify-end"
                      : "bg-slate-200 justify-start",
                  )}
                >
                  <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
                </div>
              </button>
            ) : null}

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase text-slate-400 tracking-widest font-black block mb-1">
                  Final Total
                </span>
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {total.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
              <Button
                onClick={handlePlaceOrder}
                className="h-14 min-w-[180px] bg-primary text-black font-black text-lg rounded-lg hover:bg-primary/90 transition-all border-none"
              >
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Padding for sticky footer */}
      <div className="h-32" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-20 text-center">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
