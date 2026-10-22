"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, Minus, Plus, ShoppingBag, Info, Truck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatPrice } from "@/lib/money";
import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/products/types";

/**
 * Interactive product detail UI. Rendered by the server page
 * (app/shop/[id]/page.tsx) with SEO-ready initial data.
 */
export function ProductDetailView({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const gallery = product.images.length > 0 ? product.images : [];
  // Stock: null = untracked (legacy / made-to-order) → no quantity cap.
  const maxQty = product.stock == null ? 99 : Math.max(product.stock, 1);
  const availability =
    product.stock == null
      ? "Made to order — ships in 2–3 weeks"
      : product.stock > 0
        ? `In Stock — ${product.stock} available`
        : "Out of Stock";
  const canBuy = product.stock == null || product.stock > 0;

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-timber-muted mb-8">
          <Link href="/" className="hover:text-timber-teal transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/shop" className="hover:text-timber-teal transition-colors">Shop</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-timber-darkwood" aria-current="page">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Gallery */}
          <div className="lg:w-3/5 flex flex-col gap-4">
            <ScrollReveal className="relative aspect-[4/3] md:aspect-square bg-timber-cream rounded-sm overflow-hidden interactive">
              {gallery[activeImage] ? (
                <Image
                  src={gallery[activeImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-timber-muted">
                  No image
                </div>
              )}
            </ScrollReveal>
            {gallery.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {gallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1} of ${product.name}`}
                    className={`relative w-24 h-24 flex-shrink-0 rounded-sm overflow-hidden ${activeImage === index ? 'ring-2 ring-timber-teal' : 'opacity-70 hover:opacity-100 transition-opacity'} interactive`}
                  >
                    <Image src={img} alt={`${product.name} — view ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:w-2/5 flex flex-col">
            <ScrollReveal delay={0.2} direction="left">
              <p className="text-xs text-timber-muted uppercase tracking-wider mb-2">
                {product.type || product.category}
              </p>
              <h1 className="font-serif text-4xl text-timber-darkwood mb-2">{product.name}</h1>

              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl font-medium text-timber-darkwood">
                  {formatPrice(product.pricePaise, product.currency)}
                </span>
                {product.compareAtPricePaise != null && product.compareAtPricePaise > product.pricePaise && (
                  <span className="text-timber-muted line-through text-lg">
                    {formatPrice(product.compareAtPricePaise, product.currency)}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-timber-darkwood/80 mb-8 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Quantity & Actions */}
              <div className="flex flex-col gap-4 mb-12">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium uppercase tracking-wider text-timber-darkwood">Quantity</span>
                  <div className="flex items-center border border-timber-darkwood/20">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-timber-darkwood/5 transition-colors interactive"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-timber-darkwood/5 transition-colors interactive"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    disabled={!canBuy}
                    onClick={() => {
                      add(product.id, quantity, product.stock);
                      router.push("/cart");
                    }}
                    className="flex-1 bg-timber-teal text-white py-4 font-medium tracking-wider uppercase text-sm hover:bg-timber-darkwood transition-colors flex items-center justify-center gap-2 interactive disabled:opacity-50"
                  >
                    <ShoppingBag size={18} />
                    {canBuy ? "Add to Cart" : "Out of Stock"}
                  </button>
                  <button aria-label="Add to wishlist" className="w-14 h-14 border border-timber-darkwood/20 flex items-center justify-center text-timber-darkwood hover:bg-white hover:text-red-500 hover:border-red-500 transition-colors interactive">
                    <Heart size={20} />
                  </button>
                </div>
              </div>

              {/* Accordion Specs */}
              <div className="border-t border-timber-darkwood/10 pt-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-timber-darkwood font-medium">
                    <Info size={18} />
                    <span>Specifications</span>
                  </div>
                  <ul className="text-sm text-timber-darkwood/70 space-y-2 ml-6 mt-2">
                    <li><strong className="text-timber-darkwood">Category:</strong> {product.category}</li>
                    {product.stock != null && (
                      <li><strong className="text-timber-darkwood">Stock:</strong> {product.stock} units</li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-timber-darkwood font-medium">
                    <Truck size={18} />
                    <span>Delivery & Returns</span>
                  </div>
                  <p className="text-sm text-timber-darkwood/70 ml-6 mt-2">
                    {availability}. White glove delivery available for an additional fee.
                    30-day return policy on standard items.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
