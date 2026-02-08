"use client";

import React, { useState, useEffect } from "react";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Search, ShoppingBag, MapPin, Star, MoreHorizontal, Store, MessageCircle, Share2, Camera, ExternalLink, Menu, Loader2 } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem
} from "@/components/ui/carousel";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function SellerStorefrontPreview() {
    const { user } = useUser();

    const [shop, setShop] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        fetchShopAndProducts();
    }, [user?.id]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar_url' | 'banner_url') => {
        const file = e.target.files?.[0];
        if (!file || !user || !shop) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const prefix = type === 'avatar_url' ? 'avatar' : 'banner';
            const fileName = `${user.id}/${prefix}-${Date.now()}.${fileExt}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('shop-profiles')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('shop-profiles')
                .getPublicUrl(fileName);

            // 3. Update Shops Table
            const { error: updateError } = await supabase
                .from('shops')
                .update({ [type]: publicUrl })
                .eq('id', shop.id);

            if (updateError) throw updateError;

            setShop({ ...shop, [type]: publicUrl });
            toast.success(`${type === 'avatar_url' ? 'Logo' : 'Banner'} updated!`);
        } catch (error: any) {
            console.error("Upload error:", error.message);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const fetchShopAndProducts = async () => {
        setLoading(true);
        try {
            // 1. Fetch Shop
            const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user?.id)
                .single();

            if (shopError) throw shopError;
            setShop(shopData);

            // 2. Fetch Products with categories
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name)
                `)
                .eq('shop_id', shopData.id)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;
            setProducts(productsData || []);
        } catch (error: any) {
            console.error("Fetch error:", error.message);
            toast.error("Failed to load storefront", { id: "fetch-storefront" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="font-bold text-xs uppercase tracking-[0.2em]">Loading Preview...</p>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
                    <Store className="h-10 w-10" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">No Shop Found</h2>
                    <p className="text-slate-500 font-medium">Please set up your shop profile first to see the preview.</p>
                </div>
                <Button className="bg-primary text-black font-black px-8 rounded-xl shadow-lg shadow-primary/20">Set Up Shop</Button>
            </div>
        );
    }
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-20">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] shadow-sm">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Shop Preview</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This is how customers see your store</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold text-slate-500 gap-2 border border-slate-100 hover:bg-slate-50">
                        <Share2 className="h-4 w-4" /> Share Shop
                    </Button>
                    <Button className="rounded-xl h-11 px-6 font-black bg-slate-900 text-white gap-2 hover:scale-105 transition-transform">
                        <ExternalLink className="h-4 w-4" /> Go to Live Site
                    </Button>
                </div>
            </div>

            {/* Shop Header Banner Section */}
            <div className="relative rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-slate-200/50">
                <div className="h-64 md:h-80 bg-slate-100 relative overflow-hidden group shadow-inner">
                    {shop.banner_url ? (
                        <img src={shop.banner_url} alt="Shop Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Store className="h-20 w-20 opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {isUploading && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center z-20">
                            <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
                        </div>
                    )}

                    <UiLabel htmlFor="banner-upload-sf" className="absolute top-6 right-6 h-12 w-12 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-2xl hover:bg-white/40 transition-all flex items-center justify-center cursor-pointer shadow-xl opacity-0 group-hover:opacity-100">
                        <Camera className="h-5 w-5" />
                        <input
                            type="file"
                            id="banner-upload-sf"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'banner_url')}
                            disabled={isUploading}
                        />
                    </UiLabel>
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
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-10">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <UiLabel htmlFor="avatar-upload-sf" className="absolute bottom-2 right-2 h-10 w-10 bg-amber-500 text-black rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-4 border-white opacity-0 group-hover/avatar:opacity-100 z-20">
                                <Camera className="h-4 w-4" />
                                <input
                                    type="file"
                                    id="avatar-upload-sf"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'avatar_url')}
                                    disabled={isUploading}
                                />
                            </UiLabel>
                        </div>

                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{shop.name}</h2>
                                {shop.status === 'active' && (
                                    <span className="bg-amber-100 text-amber-600 p-1 rounded-full">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <MapPin className="h-4 w-4 text-amber-500" /> {shop.location || "Philippines"}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> {shop.rating || "0.0"} Rating
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
                            <Input placeholder="Search within store..." className="h-10 pl-10 rounded-xl bg-white border-none shadow-sm text-xs font-bold" />
                        </div>
                    </div>
                </div>

                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={{
                            ...product,
                            image: product.images?.[0] || 'placeholder',
                            category: product.category?.name || "Uncategorized"
                        }}
                        isPreview={true}
                    />
                ))}
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

