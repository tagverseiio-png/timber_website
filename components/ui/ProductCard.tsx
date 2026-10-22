"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import type { CatalogProduct } from "@/lib/products/types";
import { formatPrice } from "@/lib/money";
import { useCartStore } from "@/store/useCartStore";

interface ProductCardProps {
  product: CatalogProduct;
}

// Memoized + CSS-only hover: no per-card JS state and no framer-motion instance,
// so rendering a grid of cards stays cheap.
export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const [primary, secondary] = product.images;
  const eyebrow = product.type || product.category;
  const add = useCartStore((s) => s.add);
  const soldOut = product.stock === 0;

  return (
    <div className="group flex flex-col interactive">
      <div className="relative aspect-[3/4] bg-timber-cream overflow-hidden rounded-sm mb-4">
        {/* Images (second image cross-fades in on hover when available) */}
        <Link href={`/shop/${product.id}`} className="block w-full h-full relative">
          {primary ? (
            <Image
              src={primary}
              alt={product.name}
              fill
              className={`object-contain p-4 transition-all duration-[800ms] ease-[var(--ease-organic)] group-hover:scale-110 ${secondary ? "group-hover:opacity-0" : ""}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-timber-muted text-sm">
              No image
            </div>
          )}
          {secondary && (
            <Image
              src={secondary}
              alt=""
              aria-hidden
              fill
              className="object-contain p-4 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[800ms] ease-[var(--ease-organic)]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Hover tint (cheap CSS gradient) */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out" />
        </Link>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.compareAtPricePaise != null && product.compareAtPricePaise > product.pricePaise && (
            <span className="bg-timber-teal text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1">
              Sale
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-timber-darkwood text-timber-beige text-[10px] uppercase font-bold tracking-wider px-2 py-1">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out flex justify-between gap-2 bg-gradient-to-t from-black/50 to-transparent">
          <button
            onClick={() => add(product.id, 1, product.stock)}
            disabled={soldOut}
            className="flex-1 bg-timber-beige text-timber-darkwood py-3 text-sm font-medium hover:bg-timber-teal hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingBag size={16} />
            <span>{soldOut ? "Sold Out" : "Add to Cart"}</span>
          </button>
          <button className="w-12 h-12 bg-timber-beige text-timber-darkwood flex items-center justify-center hover:bg-white hover:text-red-500 transition-colors">
            <Heart size={18} />
          </button>
        </div>

        {/* Quick view button (top right) */}
        <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-timber-darkwood opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-timber-teal hover:text-white">
          <Eye size={18} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <div className="relative inline-block self-start mb-1">
          <span className="text-xs text-timber-muted uppercase tracking-wider relative z-10">
            {eyebrow}
          </span>
          {/* CSS underline */}
          <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 group-hover:scale-x-100 bg-timber-teal transition-transform duration-500 ease-out" />
        </div>
        <Link href={`/shop/${product.id}`} className="font-serif text-lg text-timber-darkwood hover:text-timber-teal transition-colors mb-1">
          {product.name}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-timber-darkwood font-medium">{formatPrice(product.pricePaise, product.currency)}</span>
          {product.compareAtPricePaise != null && product.compareAtPricePaise > product.pricePaise && (
            <span className="text-timber-muted line-through text-sm">
              {formatPrice(product.compareAtPricePaise, product.currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
