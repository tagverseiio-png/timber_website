"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ui/ProductCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useCatalog } from "@/lib/products/catalog";
import { Filter, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = ["All", "2 Seaters", "3 Seaters", "Bar Units", "Book Shelves", "Buffets", "Chest Boxes", "Chest of Draws", "Diwans", "Misc", "Outdoor", "Puja Units", "Shoe Racks", "Showcases", "Sofas", "Wardrobes", "Souvenirs", "Cots", "Chairs", "Wallmounts and Mirrors"];

// Products per page: only one page of cards is in the DOM at a time.
const PAGE_SIZE = 24;

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim().toLowerCase(), 250);

  // Live catalog: the SAME /projects node the admin panel writes.
  const { products: catalog, loading, error } = useCatalog();

  // URL (?category=) is external state: adopt it during render via the
  // previous-value pattern instead of syncing in an effect.
  const [prevCategoryParam, setPrevCategoryParam] = useState<string | null | undefined>(undefined);
  if (categoryParam !== prevCategoryParam) {
    setPrevCategoryParam(categoryParam);
    const match = categoryParam
      ? CATEGORIES.find((c) => c.toLowerCase() === categoryParam.toLowerCase())
      : undefined;
    setActiveCategory(match ?? "All");
    setPage(1);
  }

  // Page resets live in the filter/search/sort handlers below; `safePage`
  // clamps the current page whenever the result set shrinks.
  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      if (activeCategory !== "All" && product.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
      if (debouncedQuery && !`${product.name} ${product.description} ${product.category} ${product.type}`.toLowerCase().includes(debouncedQuery)) {
        return false;
      }
      return true;
    });
  }, [catalog, activeCategory, debouncedQuery]);

  // Sort logic (simplified)
  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts];
    if (sortBy === "price-low") copy.sort((a, b) => a.pricePaise - b.pricePaise);
    else if (sortBy === "price-high") copy.sort((a, b) => b.pricePaise - a.pricePaise);
    return copy;
  }, [filteredProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = sortedProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <ScrollReveal className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">The Collection</h1>
          <p className="text-timber-muted max-w-2xl">
            Discover our entire range of premium handcrafted timber furniture.
            Each piece is designed to bring warmth and elegance to your space.
          </p>
        </ScrollReveal>

        {/* Filters and Sorting */}
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-timber-darkwood/10 pb-6" delay={0.2}>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 md:gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => { setActiveCategory(category); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm tracking-wider transition-colors interactive ${
                  activeCategory === category
                    ? "bg-timber-teal text-white"
                    : "bg-transparent text-timber-darkwood border border-timber-darkwood/20 hover:border-timber-darkwood"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 text-sm text-timber-darkwood">
            <label className="flex items-center gap-2 border border-timber-darkwood/20 rounded-full px-3 py-1.5 bg-transparent focus-within:border-timber-teal transition-colors">
              <Search size={16} className="text-timber-darkwood/60" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search products…"
                aria-label="Search products"
                className="bg-transparent outline-none text-sm w-36 md:w-44 placeholder:text-timber-darkwood/40"
              />
            </label>
            <button className="flex items-center gap-2 hover:text-timber-teal transition-colors interactive">
              <Filter size={16} />
              <span>Filters</span>
            </button>

            <div className="relative group interactive cursor-pointer">
              <div className="flex items-center gap-2 hover:text-timber-teal transition-colors">
                <span>Sort By: {sortBy === 'featured' ? 'Featured' : sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}</span>
                <ChevronDown size={16} />
              </div>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 flex flex-col py-2">
                <button onClick={() => { setSortBy("featured"); setPage(1); }} className="text-left px-4 py-2 hover:bg-timber-beige transition-colors">Featured</button>
                <button onClick={() => { setSortBy("price-low"); setPage(1); }} className="text-left px-4 py-2 hover:bg-timber-beige transition-colors">Price: Low to High</button>
                <button onClick={() => { setSortBy("price-high"); setPage(1); }} className="text-left px-4 py-2 hover:bg-timber-beige transition-colors">Price: High to Low</button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center" aria-live="polite">
            <p className="text-timber-muted text-lg">Loading the collection…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-red-700 font-medium">Couldn&apos;t load products.</p>
            <p className="text-timber-muted text-sm mt-2">{error}</p>
          </div>
        ) : pagedProducts.length > 0 ? (
          <>
            <p className="text-sm text-timber-muted mb-6" aria-live="polite">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{(safePage - 1) * PAGE_SIZE + pagedProducts.length} of {sortedProducts.length} products
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {pagedProducts.map((product, index) => (
                <ScrollReveal key={product.id} delay={0.1 * (index % 3)} direction="up">
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Product pages">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="w-10 h-10 flex items-center justify-center border border-timber-darkwood/20 text-timber-darkwood hover:border-timber-teal hover:text-timber-teal transition-colors disabled:opacity-30 disabled:pointer-events-none interactive"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-timber-darkwood px-2" aria-live="polite">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="w-10 h-10 flex items-center justify-center border border-timber-darkwood/20 text-timber-darkwood hover:border-timber-teal hover:text-timber-teal transition-colors disabled:opacity-30 disabled:pointer-events-none interactive"
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-timber-muted text-lg">No products found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-timber-beige flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
