
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, Truck, CreditCard, Wallet, Landmark, ArrowLeft, CheckCircle2, Package, ShieldCheck, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useCart, CartItem } from "@/context/CartContext";
import { useUser, Address } from "@/context/UserContext";
import { useAuthGuard } from "@/utils/auth-guard";
import { cn } from "@/lib/utils";

// ... PRODUCTS mock ...
const PRODUCTS = [
    { id: '1', name: 'Premium Leather Bag', price: 2999, category: 'Accessories' },
    { id: '2', name: 'Wireless Headphones', price: 4500, category: 'Electronics' },
    { id: '3', name: 'Minimalist Watch', price: 1500, category: 'Accessories' },
    { id: '4', name: 'Urban Hoodie', price: 999, category: 'Apparel' },
    { id: '5', name: 'Smart Speaker', price: 3200, category: 'Electronics' },
    { id: '6', name: 'Running Shoes', price: 2400, category: 'Footwear' },
];

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get("productId");
    const { cartItems, totalAmount, removeSelectedItems, clearCart, updateQuantity } = useCart();
    const { addresses, addPurchase } = useUser();
    const { protectAction } = useAuthGuard();
    const [isOrdered, setIsOrdered] = useState(false);
    const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(addresses.find(a => a.isDefault) || addresses[0] || null);
    const [showAddressList, setShowAddressList] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

    const [paymentMethod, setPaymentMethod] = useState("cod");

    useEffect(() => {
        const checkAuth = async () => {
            const isAllowed = await protectAction(window.location.pathname + window.location.search);
            if (!isAllowed) return;
            setIsCheckingAuth(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (productId) {
            const product = PRODUCTS.find(p => p.id === productId);
            if (product) {
                setCheckoutItems([{
                    ...product,
                    quantity: 1,
                    price: product.price
                }]);
            }
        } else {
            const selected = cartItems.filter(item => item.selected);
            setCheckoutItems(selected);
        }
    }, [productId, cartItems]);

    if (isCheckingAuth) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-slate-200 mx-auto rounded"></div>
                    <p className="text-slate-400">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (checkoutItems.length === 0 && !isOrdered) {
        return (
            <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
                <div className="bg-slate-100 p-8 rounded-full">
                    <ShoppingBag className="h-16 w-16 text-slate-300" />
                </div>
                <h1 className="text-3xl font-black text-slate-900">Your checkout is empty</h1>
                <p className="text-slate-500 max-w-sm">Please select items from your cart before proceeding to checkout.</p>
                <Button size="lg" className="bg-primary text-black font-bold h-14 px-10 rounded-2xl" onClick={() => router.push('/')}>
                    Go Shopping
                </Button>
            </div>
        );
    }

    const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * 58 * item.quantity), 0);

    const isFreeShipping = subtotal > 3000 || appliedVoucher === "FREESHIP";
    const shipping = subtotal > 0 ? (isFreeShipping ? 0 : 150) : 0;
    const discount = appliedVoucher === "ANEC10" ? subtotal * 0.1 : 0;
    const tax = (subtotal - discount) * 0.12;
    const total = subtotal + shipping + tax - discount;

    const formatDate = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const deliveryDate = formatDate(5);

    const handleApplyVoucher = () => {
        if (voucherCode.toUpperCase() === "ANEC10") {
            setAppliedVoucher("ANEC10");
        } else if (voucherCode.toUpperCase() === "FREESHIP") {
            setAppliedVoucher("FREESHIP");
        }
    };

    const handlePlaceOrder = () => {
        addPurchase({
            items: checkoutItems,
            total: total,
            // @ts-ignore - added status for simulation
            paymentMethod: paymentMethod
        });

        if (productId) {
            // No need to clear cart for single buy now
        } else {
            removeSelectedItems();
        }

        setIsOrdered(true);
    };

    if (isOrdered) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
                <div className="bg-green-100 p-6 rounded-full text-green-600">
                    <CheckCircle2 className="h-16 w-16" />
                </div>
                <h1 className="text-4xl font-black text-slate-900">Order Placed Successfully!</h1>
                <p className="text-slate-600 max-w-md">
                    Thank you for your purchase. Your order has been placed and is being processed via <span className="font-bold text-primary uppercase">{paymentMethod}</span>.
                    Expected delivery by <span className="font-bold text-slate-900">{deliveryDate}</span>.
                </p>
                <Button size="lg" className="bg-primary text-black font-bold h-14 px-10 rounded-2xl" onClick={() => router.push('/')}>
                    Continue Shopping
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Link href={productId ? `/product/${productId}` : "/"} className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Product
            </Link>

            <h1 className="text-3xl font-black mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Expected Delivery at Top */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <Truck className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Expected Delivery</p>
                            <p className="text-sm font-bold text-slate-700">{deliveryDate} <span className="text-[10px] font-medium text-slate-400 ml-2 italic">* Subject to weather and traffic conditions</span></p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <Card className="border-slate-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="p-6 border-b border-slate-50">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <span className="text-lg font-black">Shipping Address</span>
                                </div>
                                <Button variant="ghost" onClick={() => setShowAddressList(!showAddressList)} className="text-primary font-bold h-8 gap-1 rounded-lg hover:bg-primary/5">
                                    {selectedAddress ? "Change" : "Select"} <ChevronDown className={cn("h-4 w-4 transition-transform", showAddressList && "rotate-180")} />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {showAddressList ? (
                                <div className="space-y-3">
                                    {addresses.map(addr => (
                                        <button
                                            key={addr.id}
                                            onClick={() => {
                                                setSelectedAddress(addr);
                                                setShowAddressList(false);
                                            }}
                                            className={cn(
                                                "w-full text-left p-4 rounded-2xl border-2 transition-all group",
                                                selectedAddress?.id === addr.id
                                                    ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(255,193,7,0.1)]"
                                                    : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-sm">{addr.firstName} {addr.lastName}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">({addr.label})</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 font-medium">{addr.address}, {addr.city}, {addr.postalCode}</p>
                                                </div>
                                                {selectedAddress?.id === addr.id && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><CheckCircle2 className="h-2.5 w-2.5 text-black" /></div>}
                                            </div>
                                        </button>
                                    ))}
                                    <Button onClick={() => router.push('/profile?tab=address')} variant="outline" className="w-full h-11 rounded-xl border-dashed border-2 font-bold opacity-60 hover:opacity-100 transition-opacity">Manage Addresses</Button>
                                </div>
                            ) : (
                                selectedAddress ? (
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700">{selectedAddress.firstName} {selectedAddress.lastName}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500">{selectedAddress.label}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{selectedAddress.address}, {selectedAddress.city}, {selectedAddress.postalCode}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-muted-foreground font-medium mb-4">No shipping address selected</p>
                                        <Button onClick={() => setShowAddressList(true)} variant="outline" className="rounded-xl font-bold">Select an Address</Button>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Items (Product List) - Moved here */}
                    <Card className="border-slate-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="p-6 border-b border-slate-50">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <span className="text-lg font-black">Order Items</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {checkoutItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-6 hover:bg-slate-50/30 transition-colors">
                                        <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-300 text-xs border border-slate-50 flex-shrink-0">
                                            {item.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-tighter opacity-80">{item.category}</p>
                                            <p className="font-black text-xs text-slate-950 mt-1">{(item.price * 58).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                                        </div>

                                        {/* Item Quantity Controller */}
                                        <div className="flex items-center gap-3 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                                            <button
                                                onClick={() => {
                                                    if (productId) {
                                                        const newItems = [...checkoutItems];
                                                        newItems[0].quantity = Math.max(1, newItems[0].quantity - 1);
                                                        setCheckoutItems(newItems);
                                                    } else {
                                                        updateQuantity(item.id, -1);
                                                    }
                                                }}
                                                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all disabled:opacity-50"
                                                disabled={item.quantity <= 1}
                                            >
                                                <span className="text-lg font-black leading-none">-</span>
                                            </button>
                                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => {
                                                    if (productId) {
                                                        const newItems = [...checkoutItems];
                                                        newItems[0].quantity += 1;
                                                        setCheckoutItems(newItems);
                                                    } else {
                                                        updateQuantity(item.id, 1);
                                                    }
                                                }}
                                                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all"
                                            >
                                                <span className="text-lg font-black leading-none">+</span>
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[80px]">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Item Subtotal</p>
                                            <p className="font-black text-sm text-slate-900">{(item.price * 58 * item.quantity).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Right Sidebar */}
                    <Card className="border-slate-100 bg-white rounded-3xl h-fit overflow-hidden sticky top-24">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Shop Voucher */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Shop Voucher</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter Code (ANEC10, FREESHIP)"
                                        className="h-10 rounded-xl bg-slate-50 text-xs border-slate-100"
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value)}
                                    />
                                    <Button onClick={handleApplyVoucher} variant="outline" className="h-10 rounded-xl font-bold border-primary text-primary hover:bg-primary/5 px-4 text-xs">Apply</Button>
                                </div>
                                {appliedVoucher && (
                                    <p className="text-[10px] font-bold text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3 w-3" /> Voucher Applied: {appliedVoucher}
                                    </p>
                                )}
                            </div>

                            {/* Payment Method - Moved here */}
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Payment Method</Label>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-2">
                                    <div className="relative group">
                                        <RadioGroupItem value="cod" id="cod" className="sr-only" />
                                        <Label
                                            htmlFor="cod"
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border-2 transition-all h-14 cursor-pointer",
                                                paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-slate-100 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                                    <Wallet className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-bold text-xs">COD</span>
                                            </div>
                                            <div className={cn(
                                                "h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-all bg-white",
                                                paymentMethod === "cod" ? "border-primary" : "border-slate-200"
                                            )}>
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full bg-primary transition-opacity",
                                                    paymentMethod === "cod" ? "opacity-100" : "opacity-0"
                                                )} />
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="relative group">
                                        <RadioGroupItem value="gcash" id="gcash" className="sr-only" />
                                        <Label
                                            htmlFor="gcash"
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border-2 transition-all h-14 cursor-pointer",
                                                paymentMethod === "gcash" ? "border-primary bg-primary/5" : "border-slate-100 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-bold text-xs">GCash / Maya</span>
                                            </div>
                                            <div className={cn(
                                                "h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-all bg-white",
                                                paymentMethod === "gcash" ? "border-primary" : "border-slate-200"
                                            )}>
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full bg-primary transition-opacity",
                                                    paymentMethod === "gcash" ? "opacity-100" : "opacity-0"
                                                )} />
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Subtotal</span><span>{subtotal.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span></div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">Shipping Fee</span>
                                    {isFreeShipping ? (
                                        <span className="text-green-600 font-bold uppercase text-[10px]">Free Shipping</span>
                                    ) : (
                                        <span>{shipping.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>
                                    )}
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-xs font-medium text-green-600">
                                        <span>Discount</span>
                                        <span>- {discount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Estimated Tax (12%)</span><span>{tax.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span></div>
                                <div className="flex justify-between text-xl font-black pt-4 border-t mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold">Total Amount</span>
                                        <span>{total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button onClick={handlePlaceOrder} className="w-full h-14 bg-primary text-black font-black text-lg rounded-2xl hover:bg-primary/90 transition-all border-none">
                                        Place Order
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted-foreground font-bold uppercase">
                                        <ShieldCheck className="h-3 w-3 text-green-500" /> Secure Checkout Guaranteed
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-20 text-center">Loading Checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    )
}
