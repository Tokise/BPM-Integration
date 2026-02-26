"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function AdminHeader() {
  const {
    user,
    profile,
    signOut,
    notifications,
    clearNotifications,
  } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const userName =
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const userRole = profile?.role || "Admin";

  return (
    <header className="sticky top-0 z-[110] flex h-20 items-center gap-4 border-b border-b-slate-100 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <img
            src="/logo.png"
            alt="ANEC Global"
            className="h-9 w-auto"
          />
          <span className="hidden font-black sm:inline-block text-2xl text-foreground tracking-tighter group-hover:text-primary transition-colors">
            ANEC{" "}
            <span className="text-primary group-hover:text-foreground">
              GLOBAL
            </span>
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 md:gap-8">
        <div className="w-full max-w-xs relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search anything..."
            className="w-full bg-slate-50 pl-10 rounded-xl border-none h-11 font-medium focus-visible:ring-amber-500/20 focus-visible:bg-white focus-visible:ring-offset-0 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors hidden sm:flex"
              >
                <Bell className="h-5 w-5" />
                {notifications.some(
                  (n) => !n.isRead,
                ) && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-2xl p-0 bg-white shadow-2xl border-slate-100 mt-2 overflow-hidden z-[120]"
            >
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="font-black text-slate-900 text-sm">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {notifications.length} New
                  </span>
                  {notifications.length > 0 && (
                    <>
                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                      <button
                        onClick={
                          clearNotifications
                        }
                        className="text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase tracking-wider transition-colors"
                      >
                        Clear All
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Bell className="h-5 w-5 opacity-50" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold">
                      No new notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.type === "order") {
                          if (
                            profile?.role ===
                            "seller"
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
                          n.type ===
                          "seller_approved"
                        ) {
                          router.push(
                            "/core/transaction2/seller",
                          );
                        }
                      }}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!n.isRead ? "bg-amber-50/30" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            n.type === "order"
                              ? "bg-blue-50 text-blue-500"
                              : n.type === "promo"
                                ? "bg-purple-50 text-purple-500"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-black text-slate-900 leading-tight">
                              {n.title}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 whitespace-nowrap">
                              {n.date &&
                              !isNaN(
                                new Date(
                                  n.date,
                                ).getTime(),
                              )
                                ? new Date(
                                    n.date,
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    },
                                  )
                                : "Just now"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      </div>
                      {!n.isRead && (
                        <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 bg-slate-50/50 border-t border-slate-50">
                <Button
                  variant="ghost"
                  className="w-full h-8 text-xs font-bold text-slate-500 hover:text-primary rounded-lg"
                >
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative flex items-center gap-3 rounded-xl hover:bg-slate-50 pl-1.5 pr-3 h-12 transition-all"
              >
                <Avatar className="h-9 w-9 border-2 border-amber-500 p-0.5">
                  <AvatarFallback className="bg-amber-50 text-amber-600 font-black uppercase text-xs rounded-lg">
                    {userName
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-black text-slate-900 leading-none">
                    {userName}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-wider">
                    {userRole}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl p-2 bg-white shadow-2xl border-slate-100 mt-2"
            >
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50/50 rounded-xl">
                <Avatar className="h-10 w-10 border-2 border-amber-500 p-0.5">
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-black rounded-lg">
                    {userName
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-black text-slate-900 leading-none">
                    {userName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 truncate max-w-[140px]">
                    {user?.email}
                  </p>
                </div>
              </div>

              <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />

              <DropdownMenuItem asChild>
                <Link
                  href={
                    profile?.role === "admin"
                      ? "/admin"
                      : profile?.role === "seller"
                        ? "/seller"
                        : profile?.role === "hr"
                          ? "/hr"
                          : profile?.role ===
                              "logistics"
                            ? "/logistic"
                            : profile?.role ===
                                "finance"
                              ? "/finance"
                              : "/profile"
                  }
                  className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <User className="h-4 w-4" />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={
                    profile?.role === "admin"
                      ? "/admin/notifications"
                      : profile?.role === "seller"
                        ? "/seller/notifications"
                        : "/notifications"
                  }
                  className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={
                    profile?.role === "admin"
                      ? "/admin/settings"
                      : profile?.role === "seller"
                        ? "/seller/shop"
                        : "/profile?tab=settings"
                  }
                  className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />

              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 font-bold text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer transition-colors flex items-center gap-3"
                onClick={async () => {
                  await signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
