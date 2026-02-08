"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Package, Search, Filter, ArrowUpRight, Truck, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function SellerOrdersPage() {
    const { user } = useUser();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopId, setShopId] = useState<string | null>(null);

    // 1. Fetch Shop ID
    useEffect(() => {
        if (!user) return;
        async function fetchShop() {
            const { data, error } = await supabase
                .from('shops')
                .select('id')
                .eq('owner_id', user!.id)
                .single();

            if (data) {
                setShopId(data.id);
            } else {
                setLoading(false); // No shop found
            }
        }
        fetchShop();
    }, [user]);

    // 2. Fetch Orders & Subscribe
    useEffect(() => {
        if (!shopId) return;

        const fetchOrders = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:profiles(full_name, email)
                `)
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching orders:", error);
                toast.error("Failed to load orders");
            } else {
                setOrders(data || []);
            }
            setLoading(false);
        };

        fetchOrders();

        // Realtime Subscription
        const channel = supabase.channel('seller-orders-list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'bpm-anec-global', table: 'orders', filter: `shop_id=eq.${shopId}` },
                (payload) => {
                    // Simple strategy: refetch on any change to keep it consistent
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shopId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'to_pay': return 'bg-amber-50 text-amber-500 border-amber-100';
            case 'to_ship': return 'bg-blue-50 text-blue-500 border-blue-100';
            case 'in_transit': return 'bg-purple-50 text-purple-500 border-purple-100';
            case 'completed': return 'bg-emerald-50 text-emerald-500 border-emerald-100';
            case 'cancelled': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate Stats
    const stats = {
        new_orders: orders.filter(o => o.status === 'to_pay').length,
        to_ship: orders.filter(o => o.status === 'to_ship').length,
        to_receive: orders.filter(o => o.status === 'to_receive').length,
        completed: orders.filter(o => o.status === 'completed').length
    };

    return (
        <div className="space-y-9 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Manage Orders</h1>
                    <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Track and fulfill customer orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-medium focus-visible:ring-primary" placeholder="Search orders..." />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">To Pay</p>
                            <p className="text-2xl font-black text-slate-900">{stats.new_orders}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">To Ship</p>
                            <p className="text-2xl font-black text-slate-900">{stats.to_ship}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">To Receive</p>
                            <p className="text-2xl font-black text-slate-900">{stats.to_receive}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl p-6 bg-white overflow-hidden group">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completed</p>
                            <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Orders Table */}
            <Card className="border-none shadow-2xl shadow-slate-100 rounded-[32px] p-8 bg-white overflow-hidden">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl font-black">All Orders</CardTitle>
                </CardHeader>
                <div className="mt-4 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-bold">No orders found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order ID</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/seller/orders/${order.id}`)}
                                    >
                                        <TableCell className="font-bold py-4">#{order.id.slice(0, 8)}</TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {order.customer?.full_name || 'Guest'}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-bold">{formatDate(order.created_at)}</TableCell>
                                        <TableCell className="font-black">{formatCurrency(order.total_amount)}</TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border ${getStatusColor(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors inline-block" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>
        </div>
    );
}
