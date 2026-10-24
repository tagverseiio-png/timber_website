"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore, MAX_QTY_PER_LINE, type CartLine } from "@/store/useCartStore";
import { useCatalog } from "@/lib/products/catalog";
import type { CatalogProduct } from "@/lib/products/types";
import { formatPrice } from "@/lib/money";

export default function CartPage() {
  const { lines, setQty, remove, clear } = useCartStore();
  const { products, loading } = useCatalog();

  const detailed = lines.map((l) => ({ line: l, product: products.find((p) => p.id === l.id) }));
  const available = detailed.filter(
    (d): d is { line: CartLine; product: CatalogProduct } => d.product !== undefined
  );
  // Integer math only: sum of (paise × qty).
  const totalPaise = available.reduce((sum, d) => sum + d.product.pricePaise * d.line.qty, 0);
  const currency = available[0]?.product.currency ?? "INR";

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-8">Your Cart</h1>

        {loading ? (
          <p className="text-timber-muted text-lg">Loading cart…</p>
        ) : lines.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-timber-muted text-lg mb-8">Your cart is empty.</p>
            <Link href="/shop" className="inline-block px-8 py-3 bg-timber-darkwood text-timber-beige tracking-wide">
              Browse the Collection
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 flex flex-col gap-4">
              {detailed.map(({ line, product }) =>
                !product ? (
                  <div key={line.id} className="bg-white p-4 rounded flex items-center justify-between opacity-70">
                    <p className="text-sm text-timber-muted">This product is no longer available.</p>
                    <button onClick={() => remove(line.id)} className="text-red-600 text-sm font-medium flex items-center gap-1">
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                ) : (
                  <div key={line.id} className="bg-white p-4 rounded flex gap-4 items-center">
                    <div className="relative w-20 h-20 bg-timber-cream rounded overflow-hidden flex-shrink-0">
                      {product.images[0] && (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" unoptimized={product.images[0].startsWith("data:")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${product.id}`} className="font-serif text-lg text-timber-darkwood hover:text-timber-teal">
                        {product.name}
                      </Link>
                      <p className="text-sm text-timber-muted">{formatPrice(product.pricePaise, product.currency)} each</p>
                      {product.stock != null && (
                        <p className="text-xs text-timber-muted mt-1">
                          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center border border-timber-darkwood/20">
                      <button
                        onClick={() => setQty(line.id, line.qty - 1, product.stock)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-timber-darkwood/5"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{line.qty}</span>
                      <button
                        onClick={() => setQty(line.id, line.qty + 1, product.stock)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-timber-darkwood/5"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => remove(line.id)} className="text-gray-400 hover:text-red-600" aria-label="Remove item">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              )}
              <button onClick={clear} className="self-start text-sm text-timber-muted hover:text-red-600 mt-2">
                Clear cart
              </button>
              <p className="text-xs text-timber-muted">Max {MAX_QTY_PER_LINE} units per product.</p>
            </div>

            <aside className="lg:w-80 bg-white p-6 rounded h-fit">
              <h2 className="font-serif text-2xl text-timber-darkwood mb-4">Summary</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-timber-muted">Items</span>
                <span>{available.reduce((n, d) => n + d.line.qty, 0)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t border-timber-darkwood/10 pt-3 mt-3">
                <span>Total</span>
                <span>{formatPrice(totalPaise, currency)}</span>
              </div>
              <p className="text-xs text-timber-muted mt-2 mb-6">Shipping calculated at checkout. Prices include all taxes.</p>
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-timber-teal text-white py-4 text-sm font-medium tracking-wider uppercase hover:bg-timber-darkwood transition-colors"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
