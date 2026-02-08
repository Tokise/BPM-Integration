
"use client";

import { useState, useEffect, Suspense } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    User,
    ShoppingBag,
    Bell,
    MapPin,
    CreditCard,
    Lock,
    Shield,
    LogOut,
    ChevronRight,
    Search,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Wallet,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

function ProfileContent() {
    const { user, profile, addresses, purchases, notifications, signOut, loading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
    const [activePurchaseTab, setActivePurchaseTab] = useState("all");

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // Redirect if not logged in or if they have an admin/staff role
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/sign-in');
            } else if (profile && profile.role !== 'customer') {
                // Redirect staff/admin back to their dashboard
                const roleRedirects: Record<string, string> = {
                    admin: '/admin',
                    seller: '/seller',
                    hr: '/hr',
                    logistics: '/logistic',
                    finance: '/finance'
                };
                router.push(roleRedirects[profile.role] || '/admin');
            }
        }
    }, [user, profile, loading, router]);



    const sidebarItems = [
        {
            id: "my-profile",
            label: "My Profile",
            icon: User,
            subItems: [
                { id: "profile", label: "Profile" },
                { id: "banks", label: "Banks & Cards" },
                { id: "address", label: "Address" },
                { id: "change-pass", label: "Change Password" },
                { id: "privacy", label: "Privacy Settings" }
            ]
        },

        {
            id: "notifications",
            label: "Notifications",
            icon: Bell,
        }
    ];

    const purchaseTabs = [
        { id: "all", label: "All" },
        { id: "toPay", label: "To Pay" },
        { id: "toShip", label: "To Ship" },
        { id: "toReceive", label: "To Receive" },
        { id: "completed", label: "Completed" },
        { id: "cancelled", label: "Cancelled" },
        { id: "returnRefund", label: "Return Refund" }
    ];

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const filteredPurchases = activePurchaseTab === "all"
        ? purchases
        : purchases.filter(p => p.status === activePurchaseTab);

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <CardTitle className="text-2xl font-black">My Profile</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Manage and protect your account</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col md:flex-row gap-12">
                                <div className="space-y-6 flex-1">
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" defaultValue={user?.email?.split('@')[0]} className="h-12 rounded-xl bg-slate-50" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input id="fullName" placeholder={user?.email?.split('@')[0] || "Your Name"} className="h-12 rounded-xl bg-slate-50" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="flex gap-4">
                                            <Input id="email" defaultValue={user?.email} disabled className="h-12 rounded-xl bg-slate-200" />
                                            <Button variant="link" className="text-primary font-bold">Change</Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="flex gap-4">
                                            <Input id="phone" placeholder="0917XXXXXXX" className="h-12 rounded-xl bg-slate-50" />
                                            <Button variant="link" className="text-primary font-bold">Change</Button>
                                        </div>
                                    </div>
                                    <Button className="bg-primary text-black font-black w-32 h-12 rounded-xl mt-4">Save Changes</Button>
                                </div>
                                <div className="md:w-64 flex flex-col items-center gap-6 border-l border-slate-100 pl-12">
                                    <div className="h-32 w-32 bg-slate-100 rounded-full flex items-center justify-center text-4xl font-black text-slate-300 border-4 border-white shadow-md">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <Button variant="outline" className="rounded-xl font-bold h-10 px-6">Select Image</Button>
                                    <p className="text-[10px] text-center text-slate-400 font-medium">File size: maximum 1 MB<br />File extension: .JPEG, .PNG</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case "address":
                return (
                    <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black">My Addresses</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage your shipping addresses</p>
                            </div>
                            <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add New Address
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {addresses.map(addr => (
                                    <div key={addr.id} className="p-6 border rounded-2xl bg-white flex justify-between items-start hover:border-primary/50 transition-colors">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-lg">{addr.firstName} {addr.lastName}</span>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <span className="text-slate-500 font-medium">{addr.postalCode}</span>
                                            </div>
                                            <p className="text-slate-600 font-medium">{addr.address}, {addr.city}</p>
                                            {addr.isDefault && (
                                                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded border border-primary/20">Default</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="flex gap-4">
                                                <Button variant="link" className="text-primary h-auto p-0 font-bold">Edit</Button>
                                                {!addr.isDefault && <Button variant="link" className="text-red-500 h-auto p-0 font-bold">Delete</Button>}
                                            </div>
                                            {!addr.isDefault && (
                                                <Button variant="outline" className="rounded-lg h-8 px-3 text-xs font-bold border-slate-200">Set as Default</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );

            case "banks":
                return (
                    <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black">Banks & Cards</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Manage your payment methods</p>
                            </div>
                            <Button className="bg-primary text-black font-black rounded-xl h-11 px-6 flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add New Card
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center gap-4 text-slate-400 bg-slate-50/50">
                                <CreditCard className="h-12 w-12 opacity-20" />
                                <p className="font-bold">No cards linked yet</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            case "change-pass":
            case "privacy":
                return (
                    <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <CardTitle className="text-2xl font-black">{activeTab === "change-pass" ? "Change Password" : "Privacy Settings"}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                <p className="text-slate-500 font-medium">Settings for {activeTab.replace('-', ' ')} would be implemented here.</p>
                                <Button className="bg-primary text-black font-black rounded-xl">Update Settings</Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            case "notifications":
                return (
                    <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <CardTitle className="text-2xl font-black">Notifications</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Stay updated with your activities</p>
                        </CardHeader>
                        <CardContent className="p-8">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Bell className="h-12 w-12 mx-auto opacity-10 mb-4" />
                                    <p className="font-bold">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map(notif => (
                                        <div key={notif.id} className={cn(
                                            "p-6 rounded-2xl flex gap-4 transition-all border",
                                            notif.isRead ? "bg-white border-slate-100" : "bg-slate-50 border-slate-200"
                                        )}>
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                                                notif.type === 'order' ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"
                                            )}>
                                                {notif.type === 'order' ? <Package className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900">{notif.title}</h4>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                        {new Date(notif.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar */}
                <aside className="lg:w-72 flex-shrink-0">
                    <div className="flex items-center gap-4 mb-10 px-4">
                        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-xl font-black text-black shadow-sm ring-2 ring-white">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-slate-900 truncate">{user?.email?.split('@')[0] || 'User'}</p>
                            <button onClick={() => setActiveTab('profile')} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group">
                                <User className="h-3 w-3 group-hover:scale-110 transition-transform" /> Edit Profile
                            </button>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {sidebarItems.map(item => (
                            <div key={item.id} className="space-y-1">
                                <div className="flex items-center gap-3 px-4 py-3 text-slate-900 font-black text-sm uppercase tracking-wider">
                                    <item.icon className="h-5 w-5 text-primary" />
                                    {item.label}
                                </div>
                                {item.subItems && (
                                    <div className="ml-8 space-y-1 pr-4">
                                        {item.subItems.map(subItem => (
                                            <button
                                                key={subItem.id}
                                                onClick={() => setActiveTab(subItem.id)}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                                                    activeTab === subItem.id
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-slate-500 hover:text-primary hover:bg-slate-50"
                                                )}
                                            >
                                                {subItem.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!item.subItems && (
                                    <button
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "w-full text-left ml-8 pr-4 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            activeTab === item.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-slate-500 hover:text-primary hover:bg-slate-50"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>

                    <div className="mt-10 border-t border-slate-100 pt-6 px-4">
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl gap-3 h-12"
                        >
                            <LogOut className="h-5 w-5" /> Sign Out
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-h-[600px]">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<LoadingOverlay isVisible={true} message="Loading Profile" />}>
            <ProfileContent />
        </Suspense>
    );
}
