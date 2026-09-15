"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  woodType: string;
  image: string;
  hoverImage?: string;
  rating: number;
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group flex flex-col interactive"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] bg-timber-cream overflow-hidden rounded-sm mb-4">
        {/* Images */}
        <Link href={`/shop/${product.id}`} className="block w-full h-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-700 ease-in-out ${isHovered && product.hoverImage ? "opacity-0" : "opacity-100"}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt={`${product.name} alternate view`}
              fill
              className={`object-cover transition-opacity duration-700 ease-in-out ${isHovered ? "opacity-100 scale-105" : "opacity-0 scale-100"}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </Link>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.originalPrice && (
            <span className="bg-timber-teal text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1">
              Sale
            </span>
          )}
        </div>

        {/* Quick Actions overlay */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out flex justify-between gap-2 bg-gradient-to-t from-black/50 to-transparent`}>
          <button className="flex-1 bg-timber-beige text-timber-darkwood py-3 text-sm font-medium hover:bg-timber-teal hover:text-white transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={16} />
            <span>Add to Cart</span>
          </button>
          <button className="w-12 h-12 bg-timber-beige text-timber-darkwood flex items-center justify-center hover:bg-white hover:text-red-500 transition-colors">
            <Heart size={18} />
          </button>
        </div>

        {/* Quick view button (top right) */}
        <button className={`absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-timber-darkwood opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-timber-teal hover:text-white`}>
          <Eye size={18} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <div className="text-xs text-timber-muted uppercase tracking-wider mb-1">
          {product.woodType}
        </div>
        <Link href={`/shop/${product.id}`} className="font-serif text-lg text-timber-darkwood hover:text-timber-teal transition-colors mb-1">
          {product.name}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-timber-darkwood font-medium">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-timber-muted line-through text-sm">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
