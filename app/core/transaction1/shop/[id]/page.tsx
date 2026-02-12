"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import {
    Store,
    MapPin,
    Star,
    MessageCircle,
    Search,
    Loader2,
    ArrowLeft
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function PublicShopPage() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.id as string;

    const [shop, setShop] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchShopData() {
            if (!shopId) return;
            if (shop && products.length > 0) return; // Guard: Don't re-fetch if already loaded

            setLoading(true);
            try {
                // Fetch shop details
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', shopId)
                    .single();

                if (shopError) throw shopError;
                setShop(shopData);

                // Fetch shop products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select(`
                        *,
                        category:categories(name)
                    `)
                    .eq('shop_id', shopId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                // Fetch shop reviews
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('shop_id', shopId)
                    .order('created_at', { ascending: false });

                if (reviewsError) console.error("Error fetching reviews:", reviewsError);
                setReviews(reviewsData || []);

                if (productsError) throw productsError;
                setProducts(productsData || []);
            } catch (error) {
                console.error("Error fetching shop data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchShopData();
    }, [shopId]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Store className="h-24 w-24 text-slate-200 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-400 mb-2">Shop Not Found</h2>
                <p className="text-slate-500 mb-6">The shop you're looking for doesn't exist or is no longer active.</p>
                <Button onClick={() => router.push('/shops')} className="rounded-xl">
                    Browse All Shops
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 space-y-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="gap-2 hover:bg-slate-50 rounded-xl"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            {/* Shop Header Banner Section */}
            <div className="relative rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
                <div className="h-64 md:h-80 bg-slate-100 relative overflow-hidden shadow-inner">
                    {shop.banner_url ? (
                        <img src={shop.banner_url} alt="Shop Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Store className="h-20 w-20 opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="px-10 pb-10 -mt-20 relative z-10 flex flex-col lg:flex-row items-end justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-end gap-6 w-full lg:w-auto">
                        <div className="relative group/avatar">
                            <div className="h-40 w-40 bg-white rounded-[40px] p-2 shadow-2xl relative overflow-hidden">
                                <div className="h-full w-full bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 overflow-hidden relative">
                                    {shop.avatar_url ? (
                                        <img src={shop.avatar_url} alt={shop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="h-16 w-16" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{shop.name}</h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <MapPin className="h-4 w-4 text-amber-500" /> {shop.location || "Philippines"}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> {shop.rating || "0.0"} Rating ({reviews.length} Reviews)
                                </div>
                                <div className="flex items-center gap-1 text-slate-500 font-bold text-sm">
                                    <span className="text-slate-900 font-black">{shop.followers_count || "0"}</span> Followers
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pb-2">
                        <Button className="h-14 px-8 rounded-2xl bg-amber-500 text-black font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-200 hover:scale-105 transition-transform active:scale-95">
                            Follow Shop
                        </Button>
                        <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-900 border-none shadow-none">
                            <MessageCircle className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Shop Nav */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto custom-scrollbar no-scrollbar">
                {["Home", "All Products", "New Arrivals", "Best Seller", "About Store"].map((tab, i) => (
                    <Button
                        key={tab}
                        variant="ghost"
                        className={cn(
                            "rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest",
                            i === 0 ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-slate-900"
                        )}
                    >
                        {tab}
                    </Button>
                ))}
            </div>

            {/* Product Grid section */}
            <div className="grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                <div className="col-span-full flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Popular Products <span className="h-2 w-2 rounded-full bg-amber-500" />
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="relative w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search within store..."
                                className="h-10 pl-10 rounded-xl bg-white border-none shadow-sm text-xs font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                        <Store className="h-16 w-16 text-slate-200 mx-auto mb-3" />
                        <p className="font-bold text-slate-400">No products found in this shop</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={{
                                ...product,
                                category: product.category?.name || "Uncategorized"
                            }}
                        />
                    ))
                )}
            </div>

            {/* About Store Section */}
            <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] p-10 bg-white grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                    <Badge className="bg-amber-100 text-amber-600 rounded-lg px-3 py-1 font-black uppercase tracking-widest text-[9px] border-none shadow-none">About the Seller</Badge>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                        Crafting excellence since {shop.created_at ? new Date(shop.created_at).getFullYear() : new Date().getFullYear()}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed italic">
                        "{shop.description || "No description available."}"
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Products</p>
                            <p className="text-2xl font-black text-slate-900">{products.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Response Rate</p>
                            <p className="text-2xl font-black text-slate-900">98%</p>
                        </div>
                    </div>
                </div>
                <div className="relative group">
                    <div className="h-[300px] bg-slate-50 rounded-[32px] overflow-hidden flex items-center justify-center text-slate-200">
                        <Store className="h-24 w-24 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-amber-500 rounded-[32px] flex items-center justify-center text-black font-black text-center p-4 shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <span className="text-xs uppercase tracking-tight">Top Rated Seller 2024</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
