"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import {
    Bell,
    Search,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Sparkles
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AdminHeader() {
    const { user, profile, signOut } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const userName = profile?.full_name || user?.email?.split('@')[0] || "User";
    const userRole = profile?.role || "Admin";

    return (
        <header className="sticky top-0 z-[110] flex h-20 items-center gap-4 border-b border-b-slate-100 bg-white px-4 md:px-6">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3 group">
                    <img src="/logo.png" alt="ANEC Global" className="h-9 w-auto" />
                    <div className="hidden sm:block">
                        <h1 className="font-black text-base tracking-tighter text-slate-900 leading-none">ANEC GLOBAL</h1>
                        <p className="text-[9px] font-bold text-amber-600 tracking-widest uppercase opacity-80 mt-0.5 mt-1">Admin Panel</p>
                    </div>
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
                    <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors hidden sm:flex">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative flex items-center gap-3 rounded-xl hover:bg-slate-50 pl-1.5 pr-3 h-12 transition-all">
                                <Avatar className="h-9 w-9 border-2 border-amber-500 p-0.5">
                                    <AvatarFallback className="bg-amber-50 text-amber-600 font-black uppercase text-xs rounded-lg">
                                        {userName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden text-left md:block">
                                    <p className="text-sm font-black text-slate-900 leading-none">{userName}</p>
                                    <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-wider">
                                        {userRole}
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-white shadow-2xl border-slate-100 mt-2">
                            <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50/50 rounded-xl">
                                <Avatar className="h-10 w-10 border-2 border-amber-500 p-0.5">
                                    <AvatarFallback className="bg-amber-100 text-amber-700 font-black rounded-lg">
                                        {userName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <p className="text-sm font-black text-slate-900 leading-none">{userName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 truncate max-w-[140px]">{user?.email}</p>
                                </div>
                            </div>

                            <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span>Upgrade to Pro</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />

                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3">
                                    <User className="h-4 w-4" />
                                    <span>Account</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link href="/notifications" className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3">
                                    <Bell className="h-4 w-4" />
                                    <span>Notifications</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link href="/profile?tab=settings" className="rounded-xl px-3 py-2.5 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer transition-colors flex items-center gap-3">
                                    <Settings className="h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />

                            <DropdownMenuItem
                                className="rounded-xl px-3 py-2.5 font-bold text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer transition-colors flex items-center gap-3"
                                onClick={async () => {
                                    await signOut();
                                    router.push('/');
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
