import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuthGuard } from "@/utils/auth-guard";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  shop_id?: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  category: string;
  stock_qty?: number;
}

interface ProductCardProps {
  product: Product;
  isPreview?: boolean;
}

export function ProductCard({
  product,
  isPreview = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { protectAction } = useAuthGuard();
  const router = useRouter();

  // Use real price from database
  const priceInPhp = product.price.toLocaleString(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    },
  );

  const handleBuyNow = async (
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const isAllowed = await protectAction(
      `/core/transaction1/checkout?productId=${product.id}`,
    );
    if (isAllowed) {
      router.push(
        `/core/transaction1/checkout?productId=${product.id}`,
      );
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary/30 group border-slate-100 bg-white rounded-xl cursor-pointer p-0 shadow-sm hover:shadow-md">
      <div
        onClick={() =>
          !isPreview &&
          router.push(
            `/core/transaction1/product/${product.id}`,
          )
        }
        className="block flex-1 cursor-pointer"
      >
        <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden w-full">
          <div className="flex h-full w-full items-center justify-center text-4xl font-black bg-slate-100/30 text-slate-200/50 group-hover:scale-105 transition-transform duration-500">
            {product.images &&
            product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : product.image &&
              product.image !== "placeholder" ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              product.name
                .substring(0, 2)
                .toUpperCase()
            )}
          </div>
          {/* Out of Stock Overlay */}
          {product.stock_qty !== undefined &&
            product.stock_qty <= 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <div className="bg-red-500 text-white font-black text-[10px] px-3 py-1 rounded-full shadow-lg rotate-[-5deg] uppercase tracking-wider">
                  Out of Stock
                </div>
              </div>
            )}
          {/* Floating Add to Cart */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              disabled={
                product.stock_qty !== undefined &&
                product.stock_qty <= 0
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart({
                  id: product.id,
                  shop_id: product.shop_id,
                  name: product.name,
                  price: product.price,
                  category: product.category,
                  images: product.images,
                  image: product.image,
                });
              }}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-primary hover:bg-primary hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="p-2.5 space-y-1">
          <p className="text-[9px] font-bold text-primary uppercase tracking-tighter opacity-80">
            {product.category}
          </p>
          <h3 className="line-clamp-1 text-[13px] font-bold text-slate-800 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="font-black text-sm text-slate-900">
            {priceInPhp}
          </p>
        </div>
      </div>
      <div className="p-2 pt-0 grid grid-cols-2 gap-1 bg-white">
        <Button
          disabled={
            product.stock_qty !== undefined &&
            product.stock_qty <= 0
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart({
              id: product.id,
              shop_id: product.shop_id,
              name: product.name,
              price: product.price,
              category: product.category,
              images: product.images,
              image: product.image,
            });
          }}
          variant="outline"
          className="flex-1 h-7 text-[10px] font-bold border-slate-100 hover:bg-slate-50 rounded-lg disabled:opacity-30"
        >
          Add
        </Button>
        <Button
          disabled={
            product.stock_qty !== undefined &&
            product.stock_qty <= 0
          }
          variant="default"
          onClick={handleBuyNow}
          className="flex-1 h-7 text-[10px] font-bold bg-primary text-black hover:bg-primary/90 rounded-lg border-none disabled:opacity-30"
        >
          <Zap className="h-2.5 w-2.5 mr-0.5" />{" "}
          Buy
        </Button>
      </div>
    </Card>
  );
}
