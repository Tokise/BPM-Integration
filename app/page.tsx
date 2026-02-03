
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
import { ShoppingBasket, Gift, Smile, Menu } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Mock Data
const PRODUCTS = [
  { id: '1', name: 'Premium Leather Bag', price: 2999, category: 'Accessories', image: 'placeholder' },
  { id: '2', name: 'Wireless Headphones', price: 4500, category: 'Electronics', image: 'placeholder' },
  { id: '3', name: 'Minimalist Watch', price: 1500, category: 'Accessories', image: 'placeholder' },
  { id: '4', name: 'Urban Hoodie', price: 999, category: 'Apparel', image: 'placeholder' },
  { id: '5', name: 'Smart Speaker', price: 3200, category: 'Electronics', image: 'placeholder' },
  { id: '6', name: 'Running Shoes', price: 2400, category: 'Footwear', image: 'placeholder' },
];

const BANNERS = [
  { id: 1, src: '/banner1.png', alt: 'Banner 1' },
  { id: 2, src: '/banner2.png', alt: 'Banner 2' },
  { id: 3, src: '/banner3.png', alt: 'Banner 3' },
];

function HomeContent() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const filteredProducts = PRODUCTS; // Show all products on home page

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Category Nav & Banner Section */}
      <section className="w-full">
        <div className="container mx-auto px-4 hidden md:block">
          <div className="flex items-center gap-0 border-b border-border/40">
            <div className="flex-none bg-primary text-black w-[240px] px-6 py-3.5 font-black flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-all border-r border-black/10">
              <span className="tracking-widest">ALL CATEGORIES</span>
              <Menu className="h-5 w-5" />
            </div>
            <nav className="flex-1 flex items-center gap-6 px-10 text-[11px] font-black text-slate-500 uppercase tracking-widest justify-between">
              <a href="#" className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap">ALL VENDORS</a>
              <a href="#" className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap">ALL PRODUCTS</a>
              <a href="#" className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap">FOOTWEAR</a>
              <a href="#" className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap">HANDICRAFTS</a>
              <a href="#" className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap border-b-2 border-primary text-slate-900 px-2 h-full flex items-center">HOME DÉCOR</a>
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
                  <CarouselItem key={banner.id} className="relative h-[250px] md:h-[400px] w-full">
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
              <h3 className="font-black text-slate-900 text-lg mb-1 tracking-tight">HASSLE-FREE SHOPPING</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Shop online, support local, and easily pay with cash, GCash, PayPal, and more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-amber-50/50 transition-all cursor-default group">
            <div className="bg-slate-900 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-lg shadow-amber-200/20">
              <Smile className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 tracking-tight">EARN POINTS</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Every purchase you make and friend you invite will grant you points.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-amber-50/50 transition-all cursor-default group">
            <div className="bg-slate-900 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform shadow-lg shadow-amber-200/20">
              <Gift className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-1 tracking-tight">GET REWARDED!</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Use your points to purchase anything at ANEC Global. Free money feels so good!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Featured Collection</h2>
          <Button variant="link" className="text-amber-500 font-bold text-base cursor-pointer hover:text-amber-600 transition-colors">View all</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No products found.
            </div>
          )}
        </div>
      </section>

      {/* Categories / Promo */}
      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[300px] rounded-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden group cursor-pointer border border-border">
            <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            <h3 className="text-3xl font-bold text-foreground relative z-10">New Arrivals</h3>
          </div>
          <div className="h-[300px] rounded-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden group cursor-pointer border border-border">
            <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            <h3 className="text-3xl font-bold text-foreground relative z-10">Best Sellers</h3>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-10 w-48 bg-slate-200 mx-auto rounded-full mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
