"use client";

import {
  Suspense,
  useState,
  useEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

function SearchResults() {
  const searchParams = useSearchParams();
  const query =
    searchParams.get("q")?.toLowerCase() || "";
  const filter = searchParams.get("filter") || "";
  const categoryParam =
    searchParams.get("category") || "";
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : null;

  const [products, setProducts] = useState<any[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let fetchQuery = supabase
          .from("products")
          .select(
            `
            *,
            product_category_links (
              category:categories(name)
            )
          `,
          )
          .eq("status", "active");

        // Handle sorting and specialized filters
        if (filter === "new") {
          const today =
            new Date()
              .toISOString()
              .split("T")[0] + "T00:00:00Z";
          fetchQuery = fetchQuery
            .gte("created_at", today)
            .order("created_at", {
              ascending: false,
            });
        } else if (filter === "popular") {
          fetchQuery = fetchQuery
            .gt("sales_count", 0)
            .order("sales_count", {
              ascending: false,
            });
        } else {
          fetchQuery = fetchQuery.order(
            "created_at",
            { ascending: false },
          );
        }

        const { data, error } = await fetchQuery;

        if (error) throw error;

        // Apply filters
        let filtered = data || [];

        // Category filter
        if (categoryParam) {
          filtered = filtered.filter((p) =>
            p.product_category_links?.some(
              (link: any) =>
                link.category?.name?.toLowerCase() ===
                categoryParam.toLowerCase(),
            ),
          );
        }

        // Price filter
        if (maxPrice !== null) {
          filtered = filtered.filter(
            (p) => p.price <= maxPrice,
          );
        }

        // Keyword filter
        if (query) {
          filtered = filtered.filter(
            (product) =>
              product.name
                .toLowerCase()
                .includes(query) ||
              product.description
                ?.toLowerCase()
                .includes(query) ||
              product.category?.name
                ?.toLowerCase()
                .includes(query) ||
              product.product_category_links?.some(
                (link: any) =>
                  link.category?.name
                    ?.toLowerCase()
                    .includes(query),
              ),
          );
        }

        setProducts(filtered);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [query, filter, categoryParam, maxPrice]);

  const getPageTitle = () => {
    if (categoryParam)
      return `Products in ${categoryParam}`;
    if (maxPrice)
      return `Products Under ₱${maxPrice}`;
    if (filter === "new") return "New Arrivals";
    if (filter === "popular")
      return "Popular Products";
    if (filter === "all") return "All Products";
    if (query)
      return `Search Results for "${query}"`;
    return "Exploring Products";
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black text-slate-900">
            {getPageTitle()}
          </h1>
        </div>
        <span className="text-slate-400 text-sm font-bold md:ml-auto">
          {products.length}{" "}
          {products.length === 1
            ? "item"
            : "items"}{" "}
          found
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-slate-50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Search className="h-20 w-20 text-slate-200 mb-4" />
          <p className="text-xl font-bold text-slate-400">
            No products found.
          </p>
          <p className="text-slate-400 text-sm">
            Try using different keywords or
            exploring other categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {products.map((product) => (
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
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div>Loading search results...</div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
