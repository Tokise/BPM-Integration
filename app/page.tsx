"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  ShoppingBasket,
  Gift,
  Smile,
  Menu,
  ArrowRight,
} from "lucide-react";
import {
  useSearchParams,
  useRouter,
} from "next/navigation";
import { Suspense } from "react";
import { useUser } from "@/context/UserContext";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const BANNERS = [
  { id: 1, src: "/banner1.png", alt: "Banner 1" },
  { id: 2, src: "/banner2.png", alt: "Banner 2" },
  { id: 3, src: "/banner3.png", alt: "Banner 3" },
];

function HomeContent() {
  const router = useRouter();
  const plugin = React.useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  const {
    user,
    loading: authLoading,
    homeProducts,
    newArrivals,
    popularProducts,
    categories,
    refreshHomeProducts,
  } = useUser();
  const [loading, setLoading] =
    React.useState(!homeProducts);

  React.useEffect(() => {
    if (!authLoading) {
      refreshHomeProducts().finally(() =>
        setLoading(false),
      );
    }
  }, [authLoading]);

  const products = homeProducts || [];
  // Run when auth state changes

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Category Nav & Banner Section */}
      <section className="w-full">
        <div className="container mx-auto px-4 hidden md:block">
          <div className="flex items-center gap-0 border-b border-border/40">
            <div className="flex-none bg-primary text-black w-[240px] px-6 py-3.5 font-black flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-all border-r border-black/10">
              <span className="tracking-widest">
                ALL CATEGORIES
              </span>
              <Menu className="h-5 w-5" />
            </div>
            <nav className="flex-1 flex items-center gap-6 px-10 text-[11px] font-black text-slate-500 uppercase tracking-widest overflow-x-auto no-scrollbar">
              <a
                href="/core/transaction1/shops"
                className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
              >
                ALL VENDORS
              </a>
              <a
                href="/core/transaction1/search"
                className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
              >
                ALL PRODUCTS
              </a>
              {categories
                ?.slice(0, 5)
                .map((cat) => (
                  <a
                    key={cat.id}
                    href={`/core/transaction1/search?category=${cat.id}`}
                    className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {cat.name}
                  </a>
                ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-0">
          <div className="relative w-full overflow-hidden rounded-b-lg">
            <Carousel
              plugins={[plugin.current]}
              className="w-full"
              opts={{
                loop: true,
                duration: 60,
              }}
            >
              <CarouselContent>
                {BANNERS.map((banner) => (
                  <CarouselItem
                    key={banner.id}
                    className="relative h-[250px] md:h-[400px] w-full"
                  >
                    <img
                      src={banner.src}
                      alt={banner.alt}
                      className="h-full w-full object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-b border-amber-100">
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-amber-50/50 transition-all cursor-default group">
            <div className="bg-slate-900 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-lg shadow-amber-200/20">
              <ShoppingBasket className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 tracking-tight">
                HASSLE-FREE SHOPPING
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Shop online, support local, and
                easily pay with cash, GCash,
                PayPal, and more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-amber-50/50 transition-all cursor-default group">
            <div className="bg-slate-900 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-lg shadow-amber-200/20">
              <Smile className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 tracking-tight">
                EARN POINTS
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Every purchase you make and friend
                you invite will grant you points.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-amber-50/50 transition-all cursor-default group">
            <div className="bg-slate-900 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-lg shadow-amber-200/20">
              <Gift className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 tracking-tight">
                GET REWARDED!
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Use your points to purchase
                anything at ANEC Global. Free
                money feels so good!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banners Section - Row 1 (Savings, Rizal, Marikina) */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase mb-8">
          Feature Collection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?maxPrice=200",
              )
            }
            className="flex flex-col gap-4 cursor-pointer group"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-[10px] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl flex items-center justify-center bg-white">
              <img
                src="/savings.png"
                alt="Savings"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight text-center md:text-left">
              Under 200 pesos
            </p>
          </div>
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Rizal",
              )
            }
            className="flex flex-col gap-4 cursor-pointer group"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-[10px] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl flex items-center justify-center bg-white">
              <img
                src="/rizal.jpg"
                alt="Rizal"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight text-center md:text-left">
              Rizal
            </p>
          </div>
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Marikina",
              )
            }
            className="flex flex-col gap-4 cursor-pointer group"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-[10px] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl flex items-center justify-center bg-white">
              <img
                src="/maricina.png"
                alt="Maricina"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight text-center md:text-left">
              Marikina
            </p>
          </div>
        </div>
      </section>

      {/* Feature Product Section (Renamed from Featured Collection) */}
      <section className="container mx-auto px-4 mt-12 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            Feature Product
          </h2>
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-all hover:bg-slate-100/50"
            onClick={() =>
              router.push(
                "/core/transaction1/search?filter=all",
              )
            }
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-slate-50 h-full rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    category:
                      product.product_category_links
                        ?.map(
                          (l: any) =>
                            l.category?.name,
                        )
                        .filter(Boolean)
                        .join(", ") ||
                      "Uncategorized",
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                <p className="font-bold text-slate-400">
                  No products found.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Row 2 Banners (Bicol, Ilocos) */}
      <section className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Bicol",
              )
            }
            className="relative cursor-pointer group"
          >
            <div className="rounded-[10px] overflow-hidden transition-all hover:shadow-2xl border-4 border-white shadow-sm bg-white">
              <img
                src="/bicol.png"
                alt="Bicol"
                className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-1000"
              />
            </div>
          </div>
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Ilocos",
              )
            }
            className="relative cursor-pointer group"
          >
            <div className="rounded-[10px] overflow-hidden transition-all hover:shadow-2xl border-4 border-white shadow-sm bg-white">
              <img
                src="/ilocos.png"
                alt="Ilocos"
                className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-1000"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What's New Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            What&apos;s New
          </h2>
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-all hover:bg-slate-100/50"
            onClick={() =>
              router.push(
                "/core/transaction1/search?filter=new",
              )
            }
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {newArrivals?.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                category:
                  product.product_category_links
                    ?.map(
                      (l: any) =>
                        l.category?.name,
                    )
                    .filter(Boolean)
                    .join(", ") ||
                  "Uncategorized",
              }}
            />
          ))}
        </div>
      </section>

      {/* Row 3 Banners (Handicrafts, Accessories, Beauty) */}
      <section className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Handicrafts",
              )
            }
            className="flex flex-col gap-4 cursor-pointer group"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-[10px] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl flex items-center justify-center bg-white">
              <img
                src="/handicrafts.jpg"
                alt="Handicrafts"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight text-center md:text-left">
              Handicrafts
            </p>
          </div>
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Accessories",
              )
            }
            className="flex flex-col gap-4 cursor-pointer group"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-[10px] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl flex items-center justify-center bg-white">
              <img
                src="/accessories.jpg"
                alt="Accessories"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight text-center md:text-left">
              Accessories
            </p>
          </div>
          <div
            onClick={() =>
              router.push(
                "/core/transaction1/search?category=Beauty",
              )
            }
            className="flex flex-col gap-4 cursor-pointer group"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-[10px] overflow-hidden border border-slate-100 transition-all hover:shadow-2xl flex items-center justify-center bg-white">
              <img
                src="/beauty.png"
                alt="Beauty"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight text-center md:text-left">
              Beauty
            </p>
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            Popular Products
          </h2>
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-all hover:bg-slate-100/50"
            onClick={() =>
              router.push(
                "/core/transaction1/search?filter=popular",
              )
            }
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {popularProducts?.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                category:
                  product.product_category_links
                    ?.map(
                      (l: any) =>
                        l.category?.name,
                    )
                    .filter(Boolean)
                    .join(", ") ||
                  "Uncategorized",
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center animate-pulse">
          <div className="h-10 w-48 bg-slate-200 mx-auto rounded-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-slate-100 rounded-xl"
              />
            ))}
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
