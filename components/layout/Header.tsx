"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation";
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  Plus,
  Minus,
  Trash2,
  Check,
  ShoppingBag,
  Bell,
  LogOut,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useAuthGuard } from "@/utils/auth-guard";
import { cn } from "@/lib/utils";

export function Header() {
  const {
    cartItems,
    updateQuantity,
    toggleSelection,
    removeFromCart,
    totalAmount,
    cartCount,
  } = useCart();
  const {
    user,
    profile,
    notifications,
    clearNotifications,
    signOut,
    loading,
  } = useUser();
  const { protectAction } = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("q") || "",
  );
  const [isProfileOpen, setIsProfileOpen] =
    useState(false);
  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] = useState(false);
  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const isAuthPage =
    pathname?.startsWith("/auth");
  const isAdminPage =
    pathname?.startsWith(
      "/core/transaction3/admin",
    ) ||
    pathname?.startsWith("/hr") ||
    pathname?.startsWith("/logistic") ||
    pathname?.startsWith("/finance") ||
    pathname?.startsWith(
      "/core/transaction2/seller",
    );

  if (isAdminPage) return null;

  const onSearch = () => {
    if (searchTerm.trim()) {
      router.push(
        `/core/transaction1/search?q=${encodeURIComponent(searchTerm)}`,
      );
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
  ) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const handleCheckout = async () => {
    const selectedItems = cartItems.filter(
      (item) => item.selected,
    );
    if (selectedItems.length === 0) return;

    const isAllowed = await protectAction(
      "/core/transaction1/checkout",
    );
    if (isAllowed) {
      setIsCartOpen(false); // Close the cart drawer
      router.push("/core/transaction1/checkout");
    }
  };

  const unreadCount = notifications.filter(
    (n) => !n.isRead,
  ).length;

  return (
    <header className="sticky top-0 z-[110] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4 justify-between relative">
        {/* Logo Section - Left */}
        <div className="mr-4 flex flex-1 items-center">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 cursor-pointer group"
          >
            <img
              src="/logo.png"
              alt="Anec Global Logo"
              className="h-10 w-auto group-hover:scale-110 transition-transform"
            />
            <span className="hidden font-black sm:inline-block text-2xl text-foreground tracking-tighter group-hover:text-primary transition-colors">
              ANEC{" "}
              <span className="text-primary group-hover:text-foreground">
                GLOBAL
              </span>
            </span>
          </Link>
        </div>

        {/* Navigation - Centered */}
        {!isAuthPage && (
          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex items-center gap-8 text-sm font-black uppercase tracking-widest text-slate-500">
              <Link
                href="/"
                className="transition-all hover:text-primary hover:scale-105 cursor-pointer"
              >
                Home
              </Link>
              <Link
                href="/core/transaction1/shops"
                className="transition-all hover:text-primary hover:scale-105 cursor-pointer"
              >
                Shops
              </Link>
              <Link
                href="/about"
                className="transition-all hover:text-primary hover:scale-105 cursor-pointer"
              >
                About
              </Link>
            </nav>
          </div>
        )}

        {/* Actions - Right */}
        {!isAuthPage && (
          <div className="flex flex-1 items-center justify-end space-x-2">
            {/* Desktop Search */}
            <div className="w-full max-w-[200px] hidden md:flex items-center relative mr-2">
              <Input
                type="search"
                placeholder="Search..."
                className="pr-8 h-9 bg-slate-100/50 border-none focus-visible:ring-1 transition-colors"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                onKeyDown={handleKeyDown}
              />
              <Search
                className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
                onClick={onSearch}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer hover:text-primary hover:bg-slate-50 transition-all rounded-xl"
              onClick={onSearch}
            >
              <Search className="h-5 w-5 md:hidden" />
              <span className="sr-only">
                Search
              </span>
            </Button>

            {/* Notifications */}
            <div
              className="relative"
              onMouseEnter={() =>
                setIsNotificationOpen(true)
              }
              onMouseLeave={() =>
                setIsNotificationOpen(false)
              }
            >
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer hover:text-primary hover:bg-slate-50 transition-all rounded-xl relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-black text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">
                  Notifications
                </span>
              </Button>

              {/* Notifications Hover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-0 w-80 pt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="font-black text-slate-900 text-sm">
                        Notifications
                      </h3>
                      <Button
                        variant="link"
                        onClick={
                          clearNotifications
                        }
                        className="h-auto p-0 text-[10px] font-bold text-primary"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                      {notifications.length ===
                      0 ? (
                        <div className="p-8 text-center">
                          <p className="text-xs font-bold text-slate-400">
                            No new notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map(
                          (notif) => (
                            <div
                              key={notif.id}
                              className="p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0"
                            >
                              <div className="flex gap-3">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    notif.type ===
                                      "order"
                                      ? "bg-orange-50 text-orange-500"
                                      : "bg-blue-50 text-blue-500",
                                  )}
                                >
                                  {notif.type ===
                                  "order" ? (
                                    <Package className="h-4 w-4" />
                                  ) : (
                                    <Bell className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-slate-900 leading-tight">
                                    {notif.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                                    {
                                      notif.message
                                    }
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">
                                    {notif.date &&
                                    !isNaN(
                                      new Date(
                                        notif.date,
                                      ).getTime(),
                                    )
                                      ? new Date(
                                          notif.date,
                                        ).toLocaleTimeString(
                                          [],
                                          {
                                            hour: "2-digit",
                                            minute:
                                              "2-digit",
                                          },
                                        )
                                      : "Just now"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ),
                        )
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsNotificationOpen(
                            false,
                          );
                          router.push(
                            "/core/transaction1/profile?tab=notifications",
                          );
                        }}
                        className="w-full text-xs font-bold text-slate-500 hover:text-primary h-8"
                      >
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Drawer */}
            <Sheet
              open={isCartOpen}
              onOpenChange={setIsCartOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:text-primary hover:bg-slate-50 transition-all rounded-xl relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                  <span className="sr-only">
                    Cart
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] flex flex-col p-6"
              >
                <SheetTitle className="text-2xl font-black mb-6">
                  Your Cart
                </SheetTitle>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 -mx-2 px-2 scrollbar-thin">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                      <ShoppingCart className="h-16 w-16 opacity-10" />
                      <p className="font-bold text-slate-400">
                        Your cart is empty
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          router.push("/")
                        }
                      >
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-100 transition-all hover:border-primary/20"
                      >
                        <div className="flex gap-3">
                          {/* Selection Checkbox */}
                          <button
                            onClick={() =>
                              toggleSelection(
                                item.id,
                              )
                            }
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center transition-all mt-1",
                              item.selected
                                ? "bg-primary border-primary text-black"
                                : "border-slate-200 bg-slate-50",
                            )}
                          >
                            {item.selected && (
                              <Check className="h-2.5 w-2.5 font-black" />
                            )}
                          </button>

                          <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-300 text-sm border border-slate-50 flex-shrink-0 overflow-hidden">
                            {item.image ||
                            (item.images &&
                              item.images.length >
                                0) ? (
                              <img
                                src={
                                  item.images &&
                                  item.images
                                    .length > 0
                                    ? item
                                        .images[0]
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

                          <div className="flex-1 flex flex-col justify-center">
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                {item.name}
                              </h4>
                              <p className="text-[8px] font-bold text-primary uppercase tracking-tighter opacity-80">
                                {item.category}
                              </p>
                            </div>
                            <p className="font-black text-xs text-slate-950 mt-0.5">
                              {item.price.toLocaleString(
                                "en-PH",
                                {
                                  style:
                                    "currency",
                                  currency: "PHP",
                                },
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              removeFromCart(
                                item.id,
                              )
                            }
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-50">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            Quantity
                          </span>
                          <div className="flex items-center gap-2 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-md text-slate-400 hover:text-slate-900"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  -1,
                                )
                              }
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <span className="text-[10px] font-black w-3 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-md text-slate-400 hover:text-slate-900"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  1,
                                )
                              }
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t pt-6 pb-6 space-y-4 bg-white mt-auto sticky bottom-0">
                    <div className="flex justify-between items-end px-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Selected Total
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          {totalAmount.toLocaleString(
                            "en-PH",
                            {
                              style: "currency",
                              currency: "PHP",
                            },
                          )}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {cartItems
                          .filter(
                            (i) => i.selected,
                          )
                          .reduce(
                            (acc, i) =>
                              acc + i.quantity,
                            0,
                          )}{" "}
                        Items Selected
                      </span>
                    </div>
                    <Button
                      className="w-full h-14 bg-primary text-black font-black text-lg rounded-2xl hover:bg-primary/90 transition-all border-none disabled:opacity-50 disabled:grayscale"
                      disabled={
                        cartItems.filter(
                          (i) => i.selected,
                        ).length === 0
                      }
                      onClick={handleCheckout}
                    >
                      Go to Checkout
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
                <div className="hidden lg:flex flex-col gap-1">
                  <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                  <div className="h-2 w-10 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ) : user ? (
              <div
                className="relative"
                onMouseEnter={() =>
                  setIsProfileOpen(true)
                }
                onMouseLeave={() =>
                  setIsProfileOpen(false)
                }
              >
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-xs font-black text-black ring-2 ring-white">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                    <span className="font-bold text-sm text-slate-700">
                      Account
                    </span>
                    {profile?.role &&
                      profile.role !==
                        "customer" && (
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">
                          {profile.role}
                        </span>
                      )}
                  </div>
                </Button>

                {/* Hover Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-0 w-64 pt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-100">
                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-lg font-black text-black">
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate text-sm">
                            {
                              user.email?.split(
                                "@",
                              )[0]
                            }
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="p-2">
                        {profile?.role &&
                          [
                            "admin",
                            "hr",
                            "logistics",
                            "finance",
                            "seller",
                          ].includes(
                            profile.role.toLowerCase(),
                          ) && (
                            <Link
                              href={
                                profile.role.toLowerCase() ===
                                "admin"
                                  ? "/core/transaction3/admin"
                                  : profile.role.toLowerCase() ===
                                      "seller"
                                    ? "/core/transaction2/seller"
                                    : profile.role.toLowerCase() ===
                                        "hr"
                                      ? "/hr"
                                      : profile.role.toLowerCase() ===
                                          "logistics"
                                        ? "/logistic"
                                        : profile.role.toLowerCase() ===
                                            "finance"
                                          ? "/finance"
                                          : "/"
                              }
                              className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-900 text-white font-black transition-all hover:bg-slate-800 text-sm mb-1 shadow-lg shadow-slate-200"
                              onClick={() =>
                                setIsProfileOpen(
                                  false,
                                )
                              }
                            >
                              <ShieldCheck className="h-4 w-4 text-primary" />{" "}
                              {profile.role.toLowerCase() ===
                              "admin"
                                ? "Admin Dashboard"
                                : profile.role.toLowerCase() ===
                                    "seller"
                                  ? "Seller Dashboard"
                                  : profile.role.toLowerCase() ===
                                      "hr"
                                    ? "HR Dashboard"
                                    : profile.role.toLowerCase() ===
                                        "logistics"
                                      ? "Logistics Dashboard"
                                      : profile.role.toLowerCase() ===
                                          "finance"
                                        ? "Finance Dashboard"
                                        : "Dashboard"}
                            </Link>
                          )}
                        <Link
                          href="/core/transaction1/profile"
                          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-700 text-sm"
                          onClick={() =>
                            setIsProfileOpen(
                              false,
                            )
                          }
                        >
                          <User className="h-4 w-4 text-primary" />{" "}
                          My Profile
                        </Link>
                        <Link
                          href="/core/transaction1/purchases"
                          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-700 text-sm"
                          onClick={() =>
                            setIsProfileOpen(
                              false,
                            )
                          }
                        >
                          <ShoppingBag className="h-4 w-4 text-primary" />{" "}
                          My Purchases
                        </Link>
                        <Link
                          href="/core/transaction1/profile?tab=notifications"
                          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-700 text-sm"
                          onClick={() =>
                            setIsProfileOpen(
                              false,
                            )
                          }
                        >
                          <Bell className="h-4 w-4 text-primary" />{" "}
                          Notifications
                        </Link>
                      </div>

                      <div className="p-2 bg-slate-50/50">
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            setIsProfileOpen(
                              false,
                            );
                            await signOut();
                          }}
                          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl gap-3 h-10 text-sm"
                        >
                          <LogOut className="h-4 w-4" />{" "}
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/sign-in">
                <Button
                  variant="ghost"
                  className="hidden md:flex cursor-pointer hover:text-primary hover:bg-transparent font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden cursor-pointer"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden cursor-pointer"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">
                    Toggle Menu
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">
                  Navigation Menu
                </SheetTitle>
                <div className="grid gap-4 py-4">
                  <Link
                    href="/"
                    className="text-lg font-semibold hover:text-primary cursor-pointer"
                  >
                    Home
                  </Link>
                  <Link
                    href="/core/transaction1/shops"
                    className="text-lg font-semibold hover:text-primary cursor-pointer"
                  >
                    Shops
                  </Link>
                  <Link
                    href="/about"
                    className="text-lg font-semibold hover:text-primary cursor-pointer"
                  >
                    About
                  </Link>
                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-lg font-black text-black ring-2 ring-primary/20">
                            {user.email?.[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 truncate text-sm">
                              {
                                user.email?.split(
                                  "@",
                                )[0]
                              }
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          {profile?.role &&
                            [
                              "admin",
                              "hr",
                              "logistics",
                              "finance",
                              "seller",
                            ].includes(
                              profile.role.toLowerCase(),
                            ) && (
                              <Link
                                href={
                                  profile.role.toLowerCase() ===
                                  "admin"
                                    ? "/core/transaction3/admin"
                                    : profile.role.toLowerCase() ===
                                        "seller"
                                      ? "/core/transaction2/seller"
                                      : profile.role.toLowerCase() ===
                                          "hr"
                                        ? "/hr"
                                        : profile.role.toLowerCase() ===
                                            "logistics"
                                          ? "/logistic"
                                          : profile.role.toLowerCase() ===
                                              "finance"
                                            ? "/finance"
                                            : "/"
                                }
                                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 text-white font-black transition-all hover:bg-slate-800 text-base shadow-xl shadow-slate-200"
                              >
                                <ShieldCheck className="h-5 w-5 text-primary" />{" "}
                                {profile.role.toLowerCase() ===
                                "admin"
                                  ? "Admin Dashboard"
                                  : profile.role.toLowerCase() ===
                                      "seller"
                                    ? "Seller Dashboard"
                                    : profile.role.toLowerCase() ===
                                        "hr"
                                      ? "HR Dashboard"
                                      : profile.role.toLowerCase() ===
                                          "logistics"
                                        ? "Logistics Dashboard"
                                        : profile.role.toLowerCase() ===
                                            "finance"
                                          ? "Finance Dashboard"
                                          : "Dashboard"}
                              </Link>
                            )}
                          <Link
                            href="/core/transaction1/profile"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-700 text-sm"
                          >
                            <User className="h-4 w-4 text-primary" />{" "}
                            My Profile
                          </Link>
                          <Link
                            href="/core/transaction1/profile?tab=purchases"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-700 text-sm"
                          >
                            <ShoppingBag className="h-4 w-4 text-primary" />{" "}
                            My Purchases
                          </Link>
                          <Button
                            variant="ghost"
                            onClick={async () => {
                              await signOut();
                              router.push("/");
                            }}
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl gap-3 h-12 text-sm"
                          >
                            <LogOut className="h-4 w-4" />{" "}
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href="/auth/sign-in"
                        className="flex items-center gap-2 text-lg font-semibold hover:text-primary cursor-pointer"
                      >
                        <User className="h-5 w-5" />{" "}
                        Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </header>
  );
}
