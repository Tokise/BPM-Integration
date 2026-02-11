"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Store, MapPin, Star, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function ShopsPage() {
    const router = useRouter();
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchShops() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('shops')
                    .select('*');

                if (error) {
                    console.error("Shops query error:", error);
                    throw error;
                }
                setShops(data || []);
            } catch (error) {
                console.error("Error fetching shops:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchShops();
    }, []);

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Discover Shops</h1>
                <p className="text-slate-500 font-medium">Browse through our curated collection of verified sellers</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search shops by name or description..."
                        className="pl-12 h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="mb-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    <span className="font-bold text-slate-700">{filteredShops.length} Shops Found</span>
                </div>
            </div>

            {/* Shops Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredShops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Store className="h-20 w-20 text-slate-200 mb-4" />
                    <p className="text-xl font-bold text-slate-400">No shops found</p>
                    <p className="text-slate-400 text-sm">Try adjusting your search criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredShops.map((shop) => (
                        <Card
                            key={shop.id}
                            onClick={() => router.push(`/core/transaction1/shop/${shop.id}`)}
                            className="group cursor-pointer overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-white"
                        >
                            {/* Banner */}
                            <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                                {shop.banner_url ? (
                                    <img src={shop.banner_url} alt={shop.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Store className="h-12 w-12 text-slate-200" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="p-6 -mt-8 relative">
                                {/* Avatar */}
                                <div className="h-16 w-16 bg-white rounded-2xl p-1 shadow-xl mb-3">
                                    <div className="h-full w-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                                        {shop.avatar_url ? (
                                            <img src={shop.avatar_url} alt={shop.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="h-8 w-8 text-slate-300" />
                                        )}
                                    </div>
                                </div>

                                {/* Shop Info */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-black text-lg text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                                            {shop.name}
                                        </h3>
                                        {shop.status === 'active' && (
                                            <Badge className="bg-amber-100 text-amber-600 border-none text-[8px] font-black px-2 py-0.5">
                                                VERIFIED
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">
                                        {shop.description || "No description available"}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-bold text-slate-700">{shop.rating || "0.0"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-xs font-bold text-slate-700">{shop.followers_count || 0} Followers</span>
                                        </div>
                                    </div>

                                    {shop.location && (
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="h-3 w-3" />
                                            <span className="text-[10px] font-medium line-clamp-1">{shop.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
