"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowRight, Hammer, Search, ShoppingBag } from "lucide-react";
import { useCatalog } from "@/lib/products/catalog";
import { formatPrice } from "@/lib/money";

export default function ShopPage() {
  const { products, loading } = useCatalog();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (q && !`${p.name} ${p.description} ${p.category} ${p.type}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, selectedCategory, query]);

  return (
    <div className="bg-timber-beige min-h-screen pt-12 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <ScrollReveal className="mb-12 max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-timber-teal font-medium mb-3 block">
            Timber Atelier
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-timber-darkwood mb-6">
            The Collection
          </h1>
          <p className="text-timber-muted text-lg leading-relaxed">
            Discover our range of premium handcrafted timber furniture. Every piece is shaped from sustainable solid wood, built to bring warmth, character, and generational longevity to your living spaces.
          </p>
        </ScrollReveal>

        {/* Search & Filters */}
        <ScrollReveal delay={0.1} className="mb-10">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-timber-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="w-full pl-11 pr-4 py-3 rounded-full border border-timber-darkwood/15 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/40 transition"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-timber-teal text-white border-timber-teal shadow-sm"
                      : "bg-white/60 text-timber-darkwood border-timber-darkwood/15 hover:border-timber-teal/40 hover:bg-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/60 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-timber-darkwood/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-timber-darkwood/10 rounded w-3/4" />
                  <div className="h-3 bg-timber-darkwood/5 rounded w-1/2" />
                  <div className="h-5 bg-timber-darkwood/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {filtered.map((product, index) => (
              <ScrollReveal key={product.id} delay={Math.min(index * 0.05, 0.4)} direction="up">
                <div className="group bg-white/70 backdrop-blur-sm border border-timber-darkwood/8 rounded-2xl overflow-hidden hover:shadow-lg hover:border-timber-teal/30 transition-all duration-300 h-full flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-square bg-timber-beige overflow-hidden">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized={product.images[0].startsWith("data:")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={48} className="text-timber-darkwood/15" />
                      </div>
                    )}
                    {/* Category badge */}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-timber-darkwood text-[10px] uppercase tracking-wider font-medium px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-timber-teal font-medium mb-1">
                      {product.type}
                    </p>
                    <h3 className="font-serif text-lg text-timber-darkwood mb-2 leading-snug group-hover:text-timber-teal transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-timber-muted text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xl text-timber-darkwood font-medium">
                        {formatPrice(product.pricePaise, product.currency)}
                      </span>
                      {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
                        <span className="text-[10px] uppercase tracking-wider font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Only {product.stock} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <ScrollReveal>
            <div className="text-center py-20">
              <ShoppingBag size={56} className="text-timber-darkwood/15 mx-auto mb-4" />
              <h3 className="font-serif text-2xl text-timber-darkwood mb-2">No products found</h3>
              <p className="text-timber-muted text-sm">
                {query ? "Try a different search term" : "Check back soon for new arrivals"}
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Bespoke CTA Banner */}
        <ScrollReveal delay={0.2} direction="up">
          <div className="rounded-3xl bg-timber-teal text-white p-10 md:p-14 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Hammer size={24} />
              </div>
              <span className="text-xs uppercase tracking-widest text-timber-beige/80 font-medium mb-3 block">
                Bespoke Commissions
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="text-timber-beige/80 text-sm md:text-base leading-relaxed mb-8">
                Our artisans craft custom pieces to your exact specifications — dimensions, timber species, finishes, and joinery styles. Every commission begins with a personal consultation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="bg-timber-beige text-timber-teal hover:bg-white transition-colors rounded-full px-7 py-3 text-sm font-medium interactive inline-flex items-center gap-2"
                >
                  Request Custom Work
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/projects"
                  className="border border-timber-beige/40 text-white hover:bg-white/10 transition-colors rounded-full px-7 py-3 text-sm font-medium interactive"
                >
                  View Gallery
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
