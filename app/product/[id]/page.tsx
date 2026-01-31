
"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, ArrowLeft, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuthGuard } from "@/utils/auth-guard";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";

// Mock Data (matches Home page)
const PRODUCTS = [
    { id: '1', name: 'Premium Leather Bag', price: 2999, category: 'Accessories', description: 'Handcrafted from genuine full-grain leather, this premium bag combines classic style with modern functionality. Perfect for daily use or travel.', shop: 'LeatherCraft PH' },
    { id: '2', name: 'Wireless Headphones', price: 4500, category: 'Electronics', description: 'High-fidelity audio with active noise cancellation. Experience sound like never before with 40 hours of battery life.', shop: 'Tech Hub' },
    { id: '3', name: 'Minimalist Watch', price: 1500, category: 'Accessories', description: 'A sleek, timeless design that complements any outfit. Water-resistant and built with precision Japanese movement.', shop: 'EverTime' },
    { id: '4', name: 'Urban Hoodie', price: 999, category: 'Apparel', description: 'Super soft cotton blend hoodie with a modern fit. Stay warm and stylish in the city.', shop: 'StreetWear PH' },
    { id: '5', name: 'Smart Speaker', price: 3200, category: 'Electronics', description: 'Voice-controlled speaker with crystal clear sound. Connects with all your smart home devices seamlessly.', shop: 'Tech Hub' },
    { id: '6', name: 'Running Shoes', price: 2400, category: 'Footwear', description: 'Lightweight and breathable running shoes with superior cushioning for maximum comfort during long runs.', shop: 'Sporty' },
];

const REVIEWS = [
    { id: 1, user: "Juan D.", rating: 5, comment: "Excellent quality! Exceeded my expectations.", date: "2 days ago" },
    { id: 2, user: "Maria S.", rating: 4, comment: "Very good item, fast delivery too.", date: "1 week ago" },
];

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const { protectAction } = useAuthGuard();

    const product = PRODUCTS.find(p => p.id === params.id);

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Product not found</h1>
                <Button onClick={() => router.push('/')}>Back to Home</Button>
            </div>
        );
    }

    const priceInPhp = (product.price * 58).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP'
    });

    const relatedProducts = PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);

    const handleBuyNow = async () => {
        const isAllowed = await protectAction(`/checkout?productId=${product.id}`);
        if (isAllowed) {
            router.push(`/checkout?productId=${product.id}`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col gap-12">
            {/* Breadcrumb / Back button */}
            <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Product Images Placeholder */}
                <div className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center text-8xl font-black text-slate-200 overflow-hidden border border-slate-200">
                        {product.name.substring(0, 2).toUpperCase()}
                    </div>
                </div>

                {/* Product Info */}
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">{product.category}</p>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
                        <div className="flex items-center gap-4">
                            <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">(24 Reviews)</span>
                            <span className="text-sm border-l pl-4 text-slate-500 font-medium">Sold by <span className="text-amber-600 font-bold">{product.shop}</span></span>
                        </div>
                    </div>

                    <div className="text-4xl font-black text-slate-900">{priceInPhp}</div>

                    <p className="text-slate-600 leading-relaxed text-lg">
                        {product.description}
                    </p>

                    <div className="flex flex-col gap-4 mt-4">
                        <div className="flex items-center gap-4">
                            <Button onClick={() => addToCart(product)} variant="outline" size="lg" className="flex-1 h-16 rounded-2xl border-2 border-primary text-primary hover:bg-primary/5 font-bold gap-3 text-lg">
                                <ShoppingCart className="h-6 w-6" /> Add to Cart
                            </Button>
                            <Button onClick={handleBuyNow} size="lg" className="flex-1 h-16 rounded-2xl bg-primary text-black hover:bg-primary/90 font-bold gap-3 text-lg transition-all border-none">
                                <Zap className="h-6 w-6" /> Buy Now
                            </Button>
                        </div>
                    </div>

                    {/* Benefits/Trust Badges */}
                    <div className="grid grid-cols-3 gap-2 py-6 border-t border-b mt-4">
                        <div className="flex flex-col items-center text-center gap-1">
                            <Truck className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-bold text-slate-500">Fast Shipping</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-bold text-slate-500">Genuine Guarantee</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <RefreshCw className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-bold text-slate-500">7 Days Return</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews & Description Tabs Section */}
            <section className="mt-12">
                <div className="border-b flex gap-12 mb-8">
                    <button className="pb-4 border-b-4 border-primary font-bold text-lg">Customer Reviews (24)</button>
                    <button className="pb-4 border-b-4 border-transparent text-muted-foreground font-bold text-lg hover:text-primary transition-colors">Specifications</button>
                    <button className="pb-4 border-b-4 border-transparent text-muted-foreground font-bold text-lg hover:text-primary transition-colors">Seller Profile</button>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        {REVIEWS.map(review => (
                            <div key={review.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between mb-4">
                                    <div className="font-bold">{review.user}</div>
                                    <div className="text-xs text-muted-foreground font-medium">{review.date}</div>
                                </div>
                                <div className="flex text-amber-400 mb-3">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                                </div>
                                <p className="text-slate-700">{review.comment}</p>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold">Write a Review</Button>
                    </div>
                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 h-fit">
                        <h3 className="text-xl font-bold mb-4 text-amber-900">Why buy from ANEC Global?</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-amber-800/80">
                                <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] text-black font-bold">✓</div>
                                Verified local artisans and vendors
                            </li>
                            <li className="flex gap-3 text-amber-800/80">
                                <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] text-black font-bold">✓</div>
                                Competitive PH pricing
                            </li>
                            <li className="flex gap-3 text-amber-800/80">
                                <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] text-black font-bold">✓</div>
                                Secure payments with local options
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            <section className="mt-12">
                <h2 className="text-2xl font-bold mb-8">Related Items</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {relatedProducts.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>
        </div>
    );
}
