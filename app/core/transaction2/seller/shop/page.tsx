"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Store,
    Camera,
    Loader2,
    Save,
    MapPin,
    Globe,
    MessageSquare,
    Phone,
    Trophy,
    CheckCircle2,
    Upload
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const supabase = createClient();

export default function ShopManagementPage() {
    const { user, shop: contextShop, shopId, updateShop, sellerProducts } = useUser();
    const [shop, setShop] = useState<any>(null);
    const [productsCount, setProductsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        description: "",
        phone: "",
        website: "",
        location: "",
    });

    useEffect(() => {
        if (contextShop) {
            setShop(contextShop);
            setFormData({
                name: contextShop.name || "",
                category: contextShop.category || "",
                description: contextShop.description || "",
                phone: contextShop.phone || "",
                website: contextShop.website || "",
                location: contextShop.location || "",
            });
            setLoading(false);
            // Use sellerProducts length from context if available
            if (sellerProducts) {
                setProductsCount(sellerProducts.length);
            } else {
                fetchProductCount(contextShop.id);
            }
        } else if (user?.id) {
            fetchShopDetails();
        }
    }, [contextShop, user?.id, sellerProducts]);

    const fetchProductCount = async (sid: string) => {
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', sid);
        if (!error) setProductsCount(count || 0);
    };

    const fetchShopDetails = async () => {
        setLoading(true);
        try {
            const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user?.id)
                .single();

            if (shopError) throw shopError;
            setShop(shopData);
            setFormData({
                name: shopData.name || "",
                category: shopData.category || "",
                description: shopData.description || "",
                phone: shopData.phone || "",
                website: shopData.website || "",
                location: shopData.location || "",
            });

            // Fetch product count
            const { count, error: countError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopData.id);

            if (!countError) setProductsCount(count || 0);

        } catch (error: any) {
            console.error("Fetch error:", error.message);
            toast.error("Failed to load shop details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!shop || !user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('shops')
                .update({
                    name: formData.name,
                    category: formData.category,
                    description: formData.description,
                    phone: formData.phone,
                    website: formData.website,
                    location: formData.location
                })
                .eq('id', shop.id);

            if (error) {
                console.error("Save Error:", error);
                throw error;
            }
            const updatedShop = { ...shop, ...formData };
            setShop(updatedShop);
            updateShop(updatedShop);
            toast.success("Shop profile updated!");
        } catch (error: any) {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar_url' | 'banner_url') => {
        const file = e.target.files?.[0];
        if (!file || !user || !shop) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const prefix = type === 'avatar_url' ? 'avatar' : 'banner';
            const fileName = `${user.id}/${prefix}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('shop-profiles')
                .upload(fileName, file, {
                    upsert: true
                });

            // Simulate progress since Supabase JS doesn't support progress events easily in all envs
            // but we can at least show it's happening
            setUploadProgress(40);
            setTimeout(() => setUploadProgress(70), 500);
            setTimeout(() => setUploadProgress(90), 800);

            if (uploadError) throw uploadError;

            setUploadProgress(100);

            const { data: { publicUrl } } = supabase.storage
                .from('shop-profiles')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('shops')
                .update({ [type]: publicUrl })
                .eq('id', shop.id);

            if (updateError) throw updateError;

            const updatedShop = { ...shop, [type]: publicUrl };
            setShop(updatedShop);
            updateShop(updatedShop);
            toast.success(`${type === 'avatar_url' ? 'Logo' : 'Banner'} updated!`);
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image: " + error.message);
        } finally {
            setIsUploading(false);
            setTimeout(() => {
                setUploadProgress(0);
            }, 1000);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="font-bold text-xs uppercase tracking-[0.2em]">Loading Shop...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Shop Management</h1>
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Configure your business profile & presence</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl h-11 shadow-sm px-8 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Banner Section */}
            <div className="relative h-64 md:h-72 bg-slate-100 rounded-[40px] overflow-hidden group shadow-inner">
                {shop.banner_url ? (
                    <img src={shop.banner_url} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-200">
                        <Store className="h-16 w-16 opacity-20" />
                    </div>
                )}
                <div className="absolute bottom-6 right-6">
                    <UiLabel htmlFor="banner-upload" className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-xl hover:bg-white transition-all">
                        <Camera className="h-3.5 w-3.5" />
                        Update Banner
                        <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_url')} disabled={isUploading} />
                    </UiLabel>
                </div>
                {isUploading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center p-20 gap-4">
                        <Progress value={uploadProgress} className="h-2 w-full max-w-md bg-white/20" />
                        <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] drop-shadow-md">Uploading Banner {uploadProgress}%</p>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 mt-10 px-2 lg:px-6 relative z-10">
                {/* Left: Profile Information Card */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-10 border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white text-center flex flex-col items-center group">
                        <div className="relative group/avatar">
                            <div className="h-40 w-40 bg-white rounded-[40px] p-2 shadow-2xl relative overflow-hidden mb-6">
                                <div className="h-full w-full bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 overflow-hidden relative">
                                    {shop.avatar_url ? (
                                        <img src={shop.avatar_url} alt={shop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="h-14 w-14" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                                        <UiLabel htmlFor="avatar-upload-main" className="cursor-pointer">
                                            <Camera className="h-8 w-8 text-white" />
                                            <input type="file" id="avatar-upload-main" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar_url')} disabled={isUploading} />
                                        </UiLabel>
                                    </div>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                                            <Progress value={uploadProgress} className="h-1.5 w-full bg-white/20" />
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{shop.name}</h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Verified Seller</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 w-full gap-4 pt-8 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Followers</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight">{shop.followers_count || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Products</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight">{productsCount}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Extra achievement/status card */}
                    <Card className="p-6 border-none shadow-xl shadow-slate-100 rounded-[32px] bg-slate-900 text-white flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Seller Status</p>
                            <p className="text-sm font-black">Elite Member</p>
                        </div>
                    </Card>
                </div>

                {/* Right: Form Fields */}
                <div className="lg:col-span-8">
                    <Card className="p-10 border-none shadow-2xl shadow-slate-200/50 rounded-[40px] bg-white space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <UiLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shop Name</UiLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your shop name"
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-amber-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <UiLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shop Category</UiLabel>
                                <Input
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Ex: Electronics, Fashion, Food & Beverage"
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-amber-500/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <UiLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shop Description</UiLabel>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Tell us about your business..."
                                className="min-h-[140px] rounded-[32px] bg-slate-50 border-none font-medium text-slate-600 resize-none p-6 focus-visible:ring-amber-500/20"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <UiLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Phone</UiLabel>
                                <div className="relative">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+63 123 456 7890"
                                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-amber-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <UiLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Website (Optional)</UiLabel>
                                <div className="relative">
                                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="www.yourshop.com"
                                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-amber-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <UiLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Address</UiLabel>
                            <div className="relative">
                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Enter your street address, city"
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-amber-500/20"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
