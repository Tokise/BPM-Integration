"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ShoppingCart,
    Zap,
    Store,
    MapPin,
    Star,
    ArrowLeft,
    Loader2,
    Package,
    Shield,
    Truck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useCart } from "@/context/CartContext";
import { useAuthGuard } from "@/utils/auth-guard";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const { addToCart } = useCart();
    const { protectAction } = useAuthGuard();

    const [product, setProduct] = useState<any>(null);
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        async function fetchProductData() {
            if (!productId) return;

            setLoading(true);
            try {
                // Fetch product with category
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select(`
                        *,
                        category:categories(name)
                    `)
                    .eq('id', productId)
                    .eq('status', 'active')
                    .single();

                if (productError) throw productError;
                setProduct(productData);

                // Fetch shop details
                if (productData?.shop_id) {
                    const { data: shopData, error: shopError } = await supabase
                        .from('shops')
                        .select('*')
                        .eq('id', productData.shop_id)
                        .single();

                    if (shopError) throw shopError;
                    setShop(shopData);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProductData();
    }, [productId]);

    const handleBuyNow = async () => {
        const isAllowed = await protectAction(`/checkout?productId=${productId}`);
        if (isAllowed) {
            router.push(`/checkout?productId=${productId}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Package className="h-24 w-24 text-slate-200 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-400 mb-2">Product not found</h2>
                <p className="text-slate-500 mb-6">The product you're looking for doesn't exist or is no longer available.</p>
                <Button onClick={() => router.push('/')} className="rounded-xl">
                    Back to Home
                </Button>
            </div>
        );
    }

    const images = product.images || [];
    const priceInPhp = product.price.toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP'
    });

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="gap-2 hover:bg-slate-50 rounded-xl mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            <div className="grid md:grid-cols-2 gap-10">
                {/* Product Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                        {images.length > 0 ? (
                            <img
                                src={images[selectedImage]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <Package className="h-32 w-32" />
                            </div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="grid grid-cols-4 gap-3">
                            {images.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={cn(
                                        "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                                        selectedImage === idx
                                            ? "border-primary"
                                            : "border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <Badge className="bg-primary/10 text-primary border-none mb-3">
                            {product.category?.name || "Uncategorized"}
                        </Badge>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-5xl font-black text-primary mb-4">{priceInPhp}</p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Description</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {product.description || "No description available for this product."}
                        </p>
                    </div>

                    <Separator />

                    {/* Stock & Actions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-slate-400" />
                            <span className="font-bold text-slate-700">
                                {product.stock_qty > 0 ? (
                                    <span className="text-green-600">{product.stock_qty} in stock</span>
                                ) : (
                                    <span className="text-red-600">Out of stock</span>
                                )}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => addToCart({
                                    id: product.id,
                                    shop_id: product.shop_id,
                                    name: product.name,
                                    price: product.price,
                                    category: product.category?.name || "Uncategorized",
                                    images: product.images,
                                    image: product.images?.[0]
                                })}
                                variant="outline"
                                className="flex-1 h-14 rounded-2xl font-black text-base border-2 border-slate-900 hover:bg-slate-900 hover:text-white"
                                disabled={product.stock_qty === 0}
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Add to Cart
                            </Button>
                            <Button
                                onClick={handleBuyNow}
                                className="flex-1 h-14 rounded-2xl font-black text-base bg-primary text-black hover:bg-primary/90"
                                disabled={product.stock_qty === 0}
                            >
                                <Zap className="h-5 w-5 mr-2" />
                                Buy Now
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Shop Info */}
                    {shop && (
                        <Card
                            onClick={() => router.push(`/shop/${shop.id}`)}
                            className="p-6 cursor-pointer hover:shadow-lg transition-all rounded-2xl border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                    {shop.avatar_url ? (
                                        <img src={shop.avatar_url} alt={shop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="h-8 w-8 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-900 mb-1">{shop.name}</h4>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                            <span className="font-bold text-slate-600">{shop.rating || "0.0"}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">{shop.location || "Philippines"}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-xl">Visit Shop</Button>
                            </div>
                        </Card>
                    )}

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                            <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-600">Secure Payment</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                            <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-600">Fast Delivery</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                            <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-600">Easy Returns</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
