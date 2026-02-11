
"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q")?.toLowerCase() || "";

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        category:categories(name)
                    `)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Client-side filtering for keyword search
                const filtered = (data || []).filter(product =>
                    product.name.toLowerCase().includes(query) ||
                    product.description?.toLowerCase().includes(query) ||
                    product.category?.name?.toLowerCase().includes(query)
                );

                setProducts(filtered);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [query]);

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-8">
                <Search className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-black text-slate-900">
                    Search Results for <span className="text-primary italic">"{query}"</span>
                </h1>
                <span className="text-slate-400 text-sm font-bold ml-auto">{products.length} items found</span>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-[4/5] bg-slate-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Search className="h-20 w-20 text-slate-200 mb-4" />
                    <p className="text-xl font-bold text-slate-400">No products found matching your search.</p>
                    <p className="text-slate-400 text-sm">Try using different keywords or categories.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={{
                                ...product,
                                category: product.category?.name || "Uncategorized"
                            }}
                        />
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
