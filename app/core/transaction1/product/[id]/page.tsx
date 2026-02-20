"use client";

import { useState, useEffect } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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
  Truck,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useAuthGuard } from "@/utils/auth-guard";
import { cn } from "@/lib/utils";
import StarRating from "@/components/StarRating";
import WriteReviewDialog from "@/components/WriteReviewDialog";

const supabase = createClient();

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addToCart } = useCart();
  const { protectAction } = useAuthGuard();
  const { getProductFromCache, cacheProduct } =
    useUser();

  const [product, setProduct] =
    useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] =
    useState(0);
  const [reviews, setReviews] = useState<any[]>(
    [],
  );
  const [relatedProducts, setRelatedProducts] =
    useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] =
    useState(false);

  useEffect(() => {
    async function fetchProductData() {
      if (!productId) return;

      // Check cache first
      const cached =
        getProductFromCache(productId);
      if (cached) {
        setProduct(cached.product);
        setShop(cached.shop);
        setLoading(false);
        // Optionally refresh in background (commented out for true instant loading)
        // fetchFromSupabase();
        return;
      }

      // Fetch from Supabase if not cached
      await fetchFromSupabase();
    }

    async function fetchFromSupabase() {
      setLoading(true);
      try {
        // Fetch product with category
        const {
          data: productData,
          error: productError,
        } = await supabase
          .schema("bpm-anec-global")
          .from("products")
          .select(
            `
                        *,
                        product_category_links(category:categories(name))
                    `,
          )
          .eq("id", productId)
          .eq("status", "active")
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch shop details
        if (productData?.shop_id) {
          const {
            data: shopData,
            error: shopError,
          } = await supabase
            .schema("bpm-anec-global")
            .from("shops")
            .select("*")
            .eq("id", productData.shop_id)
            .single();

          if (shopError) throw shopError;
          setShop(shopData);

          // Cache the fetched data
          cacheProduct(
            productId,
            productData,
            shopData,
          );
        }
      } catch (error) {
        console.error(
          "Error fetching product:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [
    productId,
    getProductFromCache,
    cacheProduct,
  ]);

  // Fetch reviews when product is loaded
  useEffect(() => {
    if (product?.id) {
      fetchReviews();
      fetchRelatedProducts();
    }
  }, [product?.id]);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .schema("bpm-anec-global")
        .from("product_reviews")
        .select(
          "*, customer:profiles(full_name, avatar_url)",
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setReviews(data);
      }
    } catch (error) {
      console.error(
        "Error fetching reviews:",
        error,
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;

    try {
      const { data, error } = await supabase
        .schema("bpm-anec-global")
        .from("products")
        .select(
          "*, product_category_links(category:categories(name)), shop:shops(name)",
        )
        .eq("status", "active")
        .neq("id", productId)
        .or(
          `shop_id.eq.${product.shop_id},category_id.eq.${product.category_id}`,
        )
        .limit(6);

      if (!error && data) {
        setRelatedProducts(data);
      }
    } catch (error) {
      console.error(
        "Error fetching related products:",
        error,
      );
    }
  };

  const handleBuyNow = async () => {
    const isAllowed = await protectAction(
      `/core/transaction1/checkout?productId=${productId}`,
    );
    if (isAllowed) {
      router.push(
        `/core/transaction1/checkout?productId=${productId}`,
      );
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
        <h2 className="text-2xl font-black text-slate-400 mb-2">
          Product not found
        </h2>
        <p className="text-slate-500 mb-6">
          The product you're looking for doesn't
          exist or is no longer available.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="rounded-xl"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  const images = product.images || [];
  const priceInPhp = product.price.toLocaleString(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    },
  );

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
              {images.map(
                (img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedImage(idx)
                    }
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      selectedImage === idx
                        ? "border-primary"
                        : "border-slate-100 hover:border-slate-300",
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <Badge className="bg-primary/10 text-primary border-none mb-2 text-[10px] py-0 h-5">
              {product.product_category_links
                ?.map(
                  (l: any) => l.category?.name,
                )
                .filter(Boolean)
                .join(", ") || "Uncategorized"}
            </Badge>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              {product.name}
            </h1>
            <p className="text-3xl font-black text-primary mb-2">
              {priceInPhp}
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
              Description
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {product.description ||
                "No description available for this product."}
            </p>
          </div>

          <Separator />

          {/* Stock & Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400" />
              <span className="font-bold text-slate-700">
                {product.stock_qty > 0 ? (
                  <span className="text-green-600">
                    {product.stock_qty} in stock
                  </span>
                ) : (
                  <span className="text-red-600">
                    Out of stock
                  </span>
                )}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  addToCart({
                    id: product.id,
                    shop_id: product.shop_id,
                    name: product.name,
                    price: product.price,
                    category:
                      product.product_category_links
                        ?.map(
                          (l: any) =>
                            l.category?.name,
                        )
                        .filter(Boolean)
                        .join(", ") ||
                      "Uncategorized",
                    images: product.images,
                    image: product.images?.[0],
                  })
                }
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
              onClick={() =>
                router.push(
                  `/core/transaction1/shop/${shop.id}`,
                )
              }
              className="p-6 cursor-pointer hover:shadow-lg transition-all rounded-2xl border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                  {shop.avatar_url ? (
                    <img
                      src={shop.avatar_url}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 mb-1">
                    {shop.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-slate-600">
                        {shop.rating || "0.0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {shop.location ||
                          "Philippines"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl"
                >
                  Visit Shop
                </Button>
              </div>
            </Card>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <Shield className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-[9px] font-bold text-slate-600">
                Secure
              </p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <Truck className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-[9px] font-bold text-slate-600">
                Fast Ship
              </p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <Package className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-[9px] font-bold text-slate-600">
                Returns
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Related Items */}
      <div className="mt-20 space-y-20">
        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Customer Reviews
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <StarRating
                  rating={
                    product.average_rating || 0
                  }
                  size="md"
                  showNumber={true}
                />
                <span className="text-sm text-slate-500">
                  ({product.review_count || 0}{" "}
                  {product.review_count === 1
                    ? "review"
                    : "reviews"}
                  )
                </span>
              </div>
            </div>
            <WriteReviewDialog
              productId={productId}
              productName={product.name}
              onReviewSubmitted={fetchReviews}
            />
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-12 rounded-[2rem] border-slate-100 bg-slate-50/30 text-center">
              <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                No reviews yet. Be the first to
                review this product!
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className="p-6 rounded-[2rem] border-slate-100 bg-slate-50/30"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black">
                        {review.customer
                          ?.avatar_url ? (
                          <img
                            src={
                              review.customer
                                .avatar_url
                            }
                            alt={
                              review.customer
                                .full_name
                            }
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          review.customer
                            ?.full_name?.[0] ||
                          "U"
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">
                          {review.customer
                            ?.full_name ||
                            "Anonymous"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(
                            review.created_at,
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarRating
                        rating={review.rating}
                        size="sm"
                        showNumber={false}
                      />
                      {review.verified_purchase && (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] font-black px-2 py-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          VERIFIED
                        </Badge>
                      )}
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="font-black text-slate-900 mb-2">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {review.comment}
                  </p>

                  {/* Review Media */}
                  {review.media_urls &&
                    review.media_urls.length >
                      0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {review.media_urls
                          .slice(0, 4)
                          .map(
                            (
                              url: string,
                              idx: number,
                            ) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-lg overflow-hidden bg-slate-100"
                              >
                                {url.includes(
                                  "video",
                                ) ||
                                url.endsWith(
                                  ".mp4",
                                ) ||
                                url.endsWith(
                                  ".mov",
                                ) ? (
                                  <video
                                    src={url}
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                ) : (
                                  <img
                                    src={url}
                                    alt={`Review media ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ),
                          )}
                      </div>
                    )}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Related Items */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              You May Also Like
            </h2>
            {product.category && (
              <Button
                variant="link"
                className="text-primary font-bold"
                onClick={() =>
                  router.push(
                    `/?category=${product.category.name}`,
                  )
                }
              >
                View Category
              </Button>
            )}
          </div>
          {relatedProducts.length === 0 ? (
            <Card className="p-12 rounded-[2rem] border-slate-100 bg-slate-50/30 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                No related products found
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map(
                (relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/core/transaction1/product/${relatedProduct.id}`,
                      )
                    }
                  >
                    <div className="aspect-[4/5] bg-slate-50 rounded-2xl mb-3 overflow-hidden border border-slate-100 group-hover:shadow-md transition-all">
                      {relatedProduct.images &&
                      relatedProduct.images[0] ? (
                        <img
                          src={
                            relatedProduct
                              .images[0]
                          }
                          alt={
                            relatedProduct.name
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 mb-1 truncate">
                      {relatedProduct.name}
                    </h4>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-primary">
                        {relatedProduct.price.toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                          },
                        )}
                      </p>
                    </div>
                    {relatedProduct.average_rating >
                      0 && (
                      <div className="flex items-center gap-1">
                        <StarRating
                          rating={
                            relatedProduct.average_rating
                          }
                          size="sm"
                          showNumber={false}
                        />
                        <span className="text-[10px] text-slate-400">
                          (
                          {
                            relatedProduct.review_count
                          }
                          )
                        </span>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
