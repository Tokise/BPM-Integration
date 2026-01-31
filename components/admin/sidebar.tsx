"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Truck,
    Warehouse,
    Users,
    CreditCard,
    Settings,
    Package,
    ShieldCheck,
    UserCircle,
    BarChart3,
    LogOut,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
    {
        group: "CORE TRANSACTION",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
            { icon: BarChart3, label: "Platform Control", href: "/admin/platform" },
        ]
    },
    {
        group: "LOGISTICS",
        items: [
            { icon: Warehouse, label: "Smart Warehousing", href: "/admin/logistics/warehouse" },
            { icon: Truck, label: "Fleet & Transit", href: "/admin/logistics/fleet" },
            { icon: Package, label: "Procurement", href: "/admin/logistics/procurement" },
        ]
    },
    {
        group: "HUMAN RESOURCES",
        items: [
            { icon: Users, label: "Workforce", href: "/admin/hr/workforce" },
            { icon: ShieldCheck, label: "Recruitment", href: "/admin/hr/recruitment" },
        ]
    },
    {
        group: "FINANCIALS",
        items: [
            { icon: CreditCard, label: "Accounts", href: "/admin/financials" },
        ]
    }
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useUser();

    return (
        <aside className="w-72 bg-slate-950 text-white min-h-screen flex flex-col border-r border-slate-800">
            <div className="p-8 border-b border-slate-800">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-black font-black rotate-3 group-hover:rotate-0 transition-transform">
                        AG
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tighter">ANEC GLOBAL</h1>
                        <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">Admin Panel</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 p-6 space-y-8 overflow-y-auto scrollbar-none">
                {navItems.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">{group.group}</h2>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all group",
                                            isActive
                                                ? "bg-primary text-black"
                                                : "text-slate-400 hover:text-white hover:bg-slate-900"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5",
                                            isActive ? "text-black" : "text-slate-500 group-hover:text-primary transition-colors"
                                        )} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="h-10 w-10 bg-slate-700 rounded-full border-2 border-slate-600 flex items-center justify-center font-black text-slate-300 uppercase">
                        {user?.email?.[0] || 'A'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{user?.email?.split('@')[0] || 'Admin User'}</p>
                        <p className="text-[10px] text-slate-500 font-bold truncate">{user?.email || 'admin@anec.global'}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={async () => {
                        await signOut();
                        router.push('/');
                    }}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 font-bold rounded-xl gap-3"
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </div>
        </aside>
    );
}
