"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SellerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading } = useUser();
    const router = useRouter();

    const allowedRoles = ['seller', 'admin'];

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/sign-in');
            } else if (profile && !allowedRoles.includes(profile.role)) {
                router.push('/');
            }
        }
    }, [user, profile, loading, router]);

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
