"use client";

import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/money";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, Heart, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.remove);
  const addToCart = useCartStore((s) => s.add);
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (id: string) => {
    addToCart(id, 1);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <main className="bg-timber-beige min-h-screen pt-24 pb-32 px-6 md:px-12">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 pb-6 border-b border-timber-darkwood/10">
          <div>
            <span className="text-xs uppercase tracking-widest text-timber-teal font-semibold mb-2 block">
              Curated Favorites
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-timber-darkwood">My Wishlist</h1>
          </div>
          {items.length > 0 && (
            <p className="text-sm text-timber-muted">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-timber-darkwood/10 p-8 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-timber-teal/10 text-timber-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={30} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-timber-darkwood mb-2">Your wishlist is empty</h2>
            <p className="text-timber-muted text-sm mb-8 leading-relaxed">
              Explore our boutique collections of solid timber furniture and click the heart icon on any piece to save it for later.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-timber-darkwood text-timber-beige rounded-full hover:bg-timber-teal transition-all text-xs font-semibold uppercase tracking-widest"
            >
              <span>Explore Collection</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-timber-darkwood/5 flex flex-col group"
              >
                <Link href={`/shop/${item.id}`} className="relative aspect-[4/3] bg-timber-beige/40 overflow-hidden block">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <span className="absolute top-3 left-3 bg-timber-darkwood/80 backdrop-blur-sm text-timber-beige text-[11px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {item.category}
                  </span>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/shop/${item.id}`} className="hover:text-timber-teal transition-colors">
                      <h3 className="font-serif text-lg text-timber-darkwood mb-1 font-semibold">{item.name}</h3>
                    </Link>
                    {item.type && <p className="text-xs text-timber-muted mb-3">{item.type}</p>}
                    <p className="text-timber-darkwood font-serif text-lg font-bold mb-4">
                      {formatPrice(item.pricePaise)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-timber-darkwood/10">
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        addedId === item.id
                          ? "bg-emerald-700 text-white"
                          : "bg-timber-teal text-white hover:bg-timber-darkwood"
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>{addedId === item.id ? "Added to Cart!" : "Add to Cart"}</span>
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                      className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

