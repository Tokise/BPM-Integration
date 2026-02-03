"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading } = useUser();
    const router = useRouter();

    const allowedRoles = ['admin', 'hr', 'logistics', 'finance'];

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/sign-in');
            } else if (profile && !allowedRoles.includes(profile.role)) {
                router.push('/');
            }
        }
    }, [user, profile, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

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
