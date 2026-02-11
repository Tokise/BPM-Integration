"use client";

import { useState, useEffect, Suspense, useMemo, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Loader2,
    ShoppingBag,
    CreditCard,
    Store,
    ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const supabase = createClient();

interface OrderItem {
    id: string;
    product_name: string;
    product_image: string;
    product_category: string;
    quantity: number;
    price_at_purchase: number;
}

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    payment_method: string;
    payment_status: string;
    shipping_status: string;
    created_at: string;
    order_items: OrderItem[];
}

const STATUS_TABS = [
    { value: "all", label: "All", icon: ShoppingBag },
    { value: "to_pay", label: "To Pay", icon: CreditCard },
    { value: "to_ship", label: "To Ship", icon: Package },
    { value: "to_receive", label: "To Receive", icon: Truck },
    { value: "completed", label: "Completed", icon: CheckCircle2 },
    { value: "cancelled", label: "Cancelled", icon: XCircle },
    { value: "refund", label: "Refund", icon: RefreshCcw },
];

function PurchasesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, purchases, refreshPurchases } = useUser();
    const [activeTab, setActiveTab] = useState(searchParams.get("status") || "all");
    const [loading, setLoading] = useState(!purchases);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: (purchases as any)?.length || 0,
            to_pay: 0,
            to_ship: 0,
            to_receive: 0,
            completed: 0,
            cancelled: 0,
            refund: 0,
        };

        (purchases as any)?.forEach((order: any) => {
            if (order.status === 'refund_pending' || order.status === 'refunded') {
                counts.refund++;
            } else {
                counts[order.status] = (counts[order.status] || 0) + 1;
            }
        });

        return counts;
    }, [purchases]);

    const filteredOrders = useMemo(() => {
        return ((purchases as any) || []).filter((order: any) => {
            if (activeTab === 'all') return true;
            if (activeTab === 'refund') return order.status === 'refund_pending' || order.status === 'refunded';
            return order.status === activeTab;
        });
    }, [purchases, activeTab]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth/sign-in');
            } else {
                refreshPurchases().finally(() => setLoading(false));
            }
        }
    }, [user?.id, authLoading]);

    // Reset pagination when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            to_pay: { label: 'To Pay', className: 'bg-orange-100 text-orange-700 border-orange-200' },
            to_ship: { label: 'To Ship', className: 'bg-blue-100 text-blue-700 border-blue-200' },
            to_receive: { label: 'To Receive', className: 'bg-purple-100 text-purple-700 border-purple-200' },
            completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
            cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-700 border-slate-200' },
            refund_pending: { label: 'Refund Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            refunded: { label: 'Refunded', className: 'bg-teal-100 text-teal-700 border-teal-200' },
        };

        const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
        return <Badge className={cn("border", config.className)}>{config.label}</Badge>;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="gap-2 hover:bg-slate-50 rounded-xl mb-6 -ml-2 text-slate-500 font-bold"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
            </Button>
            <h1 className="text-xl font-black mb-8">My Purchases</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-slate-50 rounded-2xl mb-6">
                    {STATUS_TABS.map(tab => {
                        const Icon = tab.icon;
                        const count = statusCounts[tab.value] || 0;
                        return (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
                            >
                                <Icon className="h-4 w-4" />
                                <span className="font-bold">{tab.label}</span>
                                {count > 0 && (
                                    <span className="ml-1 px-2 py-0.5 text-xs font-black bg-primary text-black rounded-full">
                                        {count}
                                    </span>
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {STATUS_TABS.map(tab => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-6">
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Package className="h-24 w-24 text-slate-200 mb-4" />
                                <h3 className="text-xl font-black text-slate-400 mb-2">No orders found</h3>
                                <p className="text-slate-500 mb-6">You haven't placed any orders in this category yet.</p>
                                <Button onClick={() => router.push('/')} className="bg-primary text-black font-bold rounded-xl">
                                    Start Shopping
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {paginatedOrders.map((order: { id: Key | null | undefined; order_number: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: string; created_at: string | number | Date; order_items: any[]; total_amount: { toLocaleString: (arg0: string, arg1: { style: string; currency: string; maximumFractionDigits: number; }) => string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; }) => (
                                        <Card key={order.id} className="p-4 rounded-xl border-slate-100 hover:shadow-md transition-shadow flex flex-col h-full">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <Store className="h-2.5 w-2.5 text-amber-500" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{(order as any).shops?.name || 'Store'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-black text-sm">{order.order_number}</h3>
                                                        {getStatusBadge(order.status)}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4 flex-1">
                                                {order.order_items.map(item => (
                                                    <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                        <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {item.product_image ? (
                                                                <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="h-4 w-4 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-[11px] truncate">{item.product_name}</h4>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[9px] text-primary font-black uppercase">{item.product_category} • Qty: {item.quantity}</p>
                                                                <p className="text-[10px] font-black text-slate-600">
                                                                    {item.price_at_purchase.toLocaleString('en-PH', {
                                                                        style: 'currency',
                                                                        currency: 'PHP',
                                                                        maximumFractionDigits: 0
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] text-slate-400 uppercase font-black">Order Total</p>
                                                    <p className="text-xl font-black text-primary">
                                                        {order.total_amount.toLocaleString('en-PH', {
                                                            style: 'currency',
                                                            currency: 'PHP',
                                                            maximumFractionDigits: 0
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {order.status === 'to_pay' && (
                                                        <Button size="sm" variant="default" className="bg-primary text-black font-black rounded-lg h-8 text-[11px]">
                                                            Pay Now
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="font-black rounded-lg border-slate-200 h-8 text-[11px] px-3"
                                                        onClick={() => router.push(`/core/transaction1/orders/tracking?number=${order.order_number}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="rounded-xl h-8 text-[11px] font-black"
                                        >
                                            Prev
                                        </Button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-xl text-[11px] font-black",
                                                        currentPage === page ? "bg-primary text-black" : "text-slate-500"
                                                    )}
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="rounded-xl h-8 text-[11px] font-black"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

export default function PurchasesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <PurchasesContent />
        </Suspense>
    );
}
