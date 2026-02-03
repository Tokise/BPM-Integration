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
        <aside className="w-72 bg-white min-h-screen flex flex-col border-r border-slate-200 shadow-sm z-40">
            <div className="p-8 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black rotate-3 group-hover:rotate-0 transition-transform">
                        AG
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tighter text-slate-900">ANEC GLOBAL</h1>
                        <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">Admin Panel</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 p-6 space-y-8 overflow-y-auto scrollbar-none">
                {navItems.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">{group.group}</h2>
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
                                                ? "bg-primary text-black shadow-md shadow-primary/20"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5",
                                            isActive ? "text-black" : "text-slate-400 group-hover:text-primary transition-colors"
                                        )} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="h-10 w-10 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center font-black text-primary uppercase shadow-sm">
                        {user?.email?.[0] || 'A'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm truncate text-slate-900">{user?.email?.split('@')[0] || 'Admin User'}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{user?.email || 'admin@anec.global'}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={async () => {
                        await signOut();
                        router.push('/');
                    }}
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl gap-3"
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </div>
        </aside>
    );
}
