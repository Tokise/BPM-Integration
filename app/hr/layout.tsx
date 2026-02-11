"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function HRLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading } = useUser();
    const router = useRouter();

    const allowedRoles = ['hr', 'admin', 'logistics'];

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/sign-in');
            } else if (profile && !allowedRoles.includes(profile.role.toLowerCase())) {
                router.push('/');
            }
        }
    }, [user, profile, loading, router]);

    const isAllowed = profile && allowedRoles.includes(profile.role.toLowerCase());

    return (
        <>

            {user && profile && isAllowed && (
                <SidebarProvider>
                    <div className="fixed top-0 left-0 right-0 z-[110]">
                        <AdminHeader />
                    </div>

                    <AdminSidebar />

                    <SidebarInset className="mt-20">
                        <div className="flex bg-slate-50 flex-col min-h-[calc(100vh-5rem)]">
                            <main className="flex-1 overflow-y-auto">
                                <div className="container mx-auto p-8 max-w-7xl">
                                    {children}
                                </div>
                            </main>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            )}
        </>
    );
}

