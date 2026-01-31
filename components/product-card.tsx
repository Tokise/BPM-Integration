import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Zap } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useAuthGuard } from "@/utils/auth-guard"
import { useRouter } from "next/navigation"

interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
    category: string;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { protectAction } = useAuthGuard();
    const router = useRouter();

    // Convert price to PHP (approximate conversion for demo)
    const priceInPhp = (product.price * 58).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP'
    });

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const isAllowed = await protectAction(`/checkout?productId=${product.id}`);
        if (isAllowed) {
            router.push(`/checkout?productId=${product.id}`);
        }
    };

    return (
        <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary/30 group border-slate-100 bg-white rounded-xl">
            <Link href={`/product/${product.id}`} className="block flex-1">
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black bg-slate-100/30 text-slate-200/50 group-hover:scale-105 transition-transform duration-500">
                        {product.name.substring(0, 2).toUpperCase()}
                    </div>
                    {/* Floating Add to Cart */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart({ id: product.id, name: product.name, price: product.price, category: product.category }); }}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-primary hover:bg-primary hover:text-black transition-colors"
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
                <div className="p-2.5 space-y-1">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-tighter opacity-80">{product.category}</p>
                    <h3 className="line-clamp-1 text-[13px] font-bold text-slate-800 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="font-black text-sm text-slate-900">{priceInPhp}</p>
                </div>
            </Link>
            <div className="p-2 pt-0 grid grid-cols-2 gap-1 bg-white">
                <Button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart({ id: product.id, name: product.name, price: product.price, category: product.category }); }}
                    variant="outline"
                    className="flex-1 h-7 text-[10px] font-bold border-slate-100 hover:bg-slate-50 rounded-lg"
                >
                    Add
                </Button>
                <Button
                    variant="default"
                    onClick={handleBuyNow}
                    className="flex-1 h-7 text-[10px] font-bold bg-primary text-black hover:bg-primary/90 rounded-lg border-none"
                >
                    <Zap className="h-2.5 w-2.5 mr-0.5" /> Buy
                </Button>
            </div>
        </Card>
    )
}
