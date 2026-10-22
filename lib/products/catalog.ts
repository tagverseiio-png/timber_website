"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { toCatalogProduct, type CatalogProduct, type RawProductRow } from "@/lib/products/types";
import { BOUTIQUE_PRODUCTS } from "@/lib/products/boutique_seed";

const fallbackCatalog: CatalogProduct[] = BOUTIQUE_PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  category: p.category,
  type: p.type,
  pricePaise: p.pricePaise,
  currency: "INR",
  stock: p.stock,
  images: [p.image],
  description: p.description,
  isActive: true,
  orderIndex: p.orderIndex,
}));

/**
 * Live catalog hook — subscribes to Firebase /projects node.
 * Automatically falls back to the 16 boutique products if Firebase is empty
 * or if rules restrict public reads.
 */
export function useCatalog() {
  const [rows, setRows] = useState<CatalogProduct[]>(fallbackCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const projectsRef = ref(database, "projects");
      const unsubscribe = onValue(
        projectsRef,
        (snapshot) => {
          const data = snapshot.val() as Record<string, RawProductRow> | null;
          if (!data || Object.keys(data).length === 0) {
            setRows(fallbackCatalog);
          } else {
            const list = Object.keys(data)
              .map((key) => toCatalogProduct(key, data[key] ?? {}))
              .filter((p) => p.isActive)
              .sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
            setRows(list.length > 0 ? list : fallbackCatalog);
          }
          setError(null);
          setLoading(false);
        },
        () => {
          // If Firebase permissions prevent unauthenticated client read, use fallback
          setRows(fallbackCatalog);
          setError(null);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch {
      setRows(fallbackCatalog);
      setLoading(false);
    }
  }, []);

  const products = useMemo(() => rows, [rows]);
  return { products, loading, error };
}
