
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Search } from "lucide-react";

// Same Mock Data as app/page.tsx
const PRODUCTS = [
    { id: '1', name: 'Premium Leather Bag', price: 2999, category: 'Accessories', image: 'placeholder' },
    { id: '2', name: 'Wireless Headphones', price: 4500, category: 'Electronics', image: 'placeholder' },
    { id: '3', name: 'Minimalist Watch', price: 1500, category: 'Accessories', image: 'placeholder' },
    { id: '4', name: 'Urban Hoodie', price: 999, category: 'Apparel', image: 'placeholder' },
    { id: '5', name: 'Smart Speaker', price: 3200, category: 'Electronics', image: 'placeholder' },
    { id: '6', name: 'Running Shoes', price: 2400, category: 'Footwear', image: 'placeholder' },
];

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q")?.toLowerCase() || "";

    const filteredProducts = PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-8">
                <Search className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-black text-slate-900">
                    Search Results for <span className="text-primary italic">"{query}"</span>
                </h1>
                <span className="text-slate-400 text-sm font-bold ml-auto">{filteredProducts.length} items found</span>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Search className="h-20 w-20 text-slate-200 mb-4" />
                    <p className="text-xl font-bold text-slate-400">No products found matching your search.</p>
                    <p className="text-slate-400 text-sm">Try using different keywords or categories.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading search results...</div>}>
            <SearchResults />
        </Suspense>
    );
}
