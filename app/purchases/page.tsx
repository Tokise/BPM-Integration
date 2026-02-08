"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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
    CreditCard
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
    const [activeTab, setActiveTab] = useState(searchParams.get("status") || "all");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/sign-in');
                return;
            }

            let query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        product_name,
                        product_image,
                        product_category,
                        quantity,
                        price_at_purchase
                    )
                `)
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (activeTab !== 'all') {
                if (activeTab === 'refund') {
                    query = query.in('status', ['refund_pending', 'refunded']);
                } else {
                    query = query.eq('status', activeTab);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            setOrders(data || []);

            // Calculate status counts
            const { data: allOrders } = await supabase
                .from('orders')
                .select('status')
                .eq('customer_id', user.id);

            const counts: Record<string, number> = {
                all: allOrders?.length || 0,
                to_pay: 0,
                to_ship: 0,
                to_receive: 0,
                completed: 0,
                cancelled: 0,
                refund: 0,
            };

            allOrders?.forEach(order => {
                if (order.status === 'refund_pending' || order.status === 'refunded') {
                    counts.refund++;
                } else {
                    counts[order.status] = (counts[order.status] || 0) + 1;
                }
            });

            setStatusCounts(counts);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-black mb-8">My Purchases</h1>

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
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Package className="h-24 w-24 text-slate-200 mb-4" />
                                <h3 className="text-xl font-black text-slate-400 mb-2">No orders found</h3>
                                <p className="text-slate-500 mb-6">You haven't placed any orders in this category yet.</p>
                                <Button onClick={() => router.push('/')} className="bg-primary text-black font-bold rounded-xl">
                                    Start Shopping
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <Card key={order.id} className="p-6 rounded-2xl border-slate-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-black text-lg">{order.order_number}</h3>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Ordered on {new Date(order.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total</p>
                                                <p className="text-2xl font-black text-primary">
                                                    {order.total_amount.toLocaleString('en-PH', {
                                                        style: 'currency',
                                                        currency: 'PHP'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {order.order_items.map(item => (
                                                <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                                    <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {item.product_image ? (
                                                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-slate-300 font-black text-sm">
                                                                {item.product_name.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-sm">{item.product_name}</h4>
                                                        <p className="text-xs text-primary font-bold uppercase">{item.product_category}</p>
                                                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-sm">
                                                            {item.price_at_purchase.toLocaleString('en-PH', {
                                                                style: 'currency',
                                                                currency: 'PHP'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                            {order.status === 'to_pay' && (
                                                <Button variant="default" className="bg-primary text-black font-bold rounded-xl">
                                                    Pay Now
                                                </Button>
                                            )}
                                            {order.status === 'to_receive' && (
                                                <Button variant="default" className="bg-primary text-black font-bold rounded-xl">
                                                    Order Received
                                                </Button>
                                            )}
                                            {(order.status === 'to_pay' || order.status === 'to_ship') && (
                                                <Button variant="outline" className="font-bold rounded-xl border-slate-200">
                                                    Cancel Order
                                                </Button>
                                            )}
                                            <Button variant="outline" className="font-bold rounded-xl border-slate-200">
                                                View Details
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
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
