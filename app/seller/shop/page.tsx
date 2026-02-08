"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, MapPin, Phone, Globe, Camera, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export default function SellerShopPage() {
    const { user } = useUser();

    const [shop, setShop] = useState<any>(null);
    const [productCount, setProductCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        fetchShopData();
    }, [user?.id]);

    const fetchShopData = async () => {
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

            // 2. Fetch Product Count
            const { count, error: countError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopData.id);

            if (!countError) setProductCount(count || 0);
        } catch (error: any) {
            console.error("Fetch error:", error.message);
            toast.error("Failed to load shop details", { id: "fetch-shop" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!shop) return;

        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const updates = {
            name: formData.get("shopName") as string,
            description: formData.get("description") as string,
            phone: formData.get("phone") as string,
            website: formData.get("website") as string,
            location: formData.get("address") as string,
        };

        try {
            const { error } = await supabase
                .from('shops')
                .update(updates)
                .eq('id', shop.id);

            if (error) throw error;
            setShop({ ...shop, ...updates });
            toast.success("Shop profile updated successfully!", { id: "shop-update-success" });
        } catch (error: any) {
            toast.error("Failed to save changes", { id: "shop-update-error" });
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

    const initializeShop = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('shops')
                .insert([{
                    owner_id: user.id,
                    name: `${user.user_metadata.full_name || 'My'}'s Shop`,
                    description: "Welcome to my shop!",
                    status: 'active'
                }])
                .select()
                .single();

            if (error) throw error;
            setShop(data);
            toast.success("Shop profile initialized!");
        } catch (error: any) {
            toast.error("Failed to initialize shop");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="font-bold text-xs uppercase tracking-[0.2em]">Loading Shop Profile...</p>
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
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">No Shop Profile</h2>
                    <p className="text-slate-500 font-medium">You haven't set up your shop profile yet.</p>
                </div>
                <Button
                    onClick={initializeShop}
                    disabled={isSaving}
                    className="bg-primary text-black font-black px-8 rounded-xl shadow-lg shadow-primary/20"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Shop"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900">Shop Management</h1>
                        <p className="font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em]">Configure your business profile & presence</p>
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            <div className="relative group">
                <div className="h-60 w-full bg-slate-100 rounded-[32px] overflow-hidden relative shadow-2xl shadow-slate-100/50">
                    {shop.banner_url ? (
                        <img src={shop.banner_url} alt="Shop Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Store className="h-16 w-16 opacity-20" />
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    )}
                    <UiLabel htmlFor="banner-upload" className="absolute bottom-6 right-6 h-12 px-6 bg-white/90 backdrop-blur-md text-slate-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all border border-slate-100 flex items-center justify-center cursor-pointer gap-2 opacity-0 group-hover:opacity-100">
                        <Camera className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wider">Update Banner</span>
                        <input
                            type="file"
                            id="banner-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'banner_url')}
                            disabled={isUploading}
                        />
                    </UiLabel>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <Card className="lg:col-span-1 border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-10">
                    <div className="flex flex-col items-center text-center gap-8">
                        <div className="relative">
                            <div className="h-40 w-40 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 border-8 border-white shadow-2xl overflow-hidden relative group">
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                )}
                                {shop.avatar_url ? (
                                    <img src={shop.avatar_url} alt={shop.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Store className="h-16 w-16" />
                                )}
                            </div>
                            <UiLabel htmlFor="avatar-upload" className="absolute bottom-2 right-2 h-12 w-12 bg-amber-500 text-black rounded-2xl shadow-xl hover:scale-110 transition-transform border-4 border-white flex items-center justify-center cursor-pointer">
                                <Camera className="h-5 w-5" />
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'avatar_url')}
                                    disabled={isUploading}
                                />
                            </UiLabel>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{shop.name}</h2>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Verified Seller</p>
                        </div>
                        <div className="grid grid-cols-2 w-full gap-8 pt-8 border-t border-slate-50">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Followers</p>
                                <p className="text-2xl font-black text-slate-900">{shop.followers_count || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Products</p>
                                <p className="text-2xl font-black text-slate-900">{productCount}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Edit Form */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 rounded-[32px] bg-white overflow-hidden p-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <UiLabel htmlFor="shopName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shop Name</UiLabel>
                                <Input id="shopName" name="shopName" defaultValue={shop.name} className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-2">
                                <UiLabel htmlFor="category" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Main Category</UiLabel>
                                <Input id="category" name="category" defaultValue="Electronics" className="h-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-primary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <UiLabel htmlFor="description" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shop Description</UiLabel>
                            <Textarea id="description" name="description" defaultValue={shop.description} className="min-h-[120px] rounded-xl bg-slate-50 border-none font-medium focus-visible:ring-primary" placeholder="Tell customers about your shop..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <UiLabel htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Phone</UiLabel>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="phone" name="phone" defaultValue={shop.phone} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <UiLabel htmlFor="website" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Website (Optional)</UiLabel>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="website" name="website" defaultValue={shop.website} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <UiLabel htmlFor="address" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Address</UiLabel>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                                <Textarea id="address" name="address" defaultValue={shop.location} className="pl-12 min-h-[80px] rounded-xl bg-slate-50 border-none font-medium focus-visible:ring-primary" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button disabled={isSaving} className="bg-primary text-black font-black h-12 px-10 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

