"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { toCatalogProduct, type CatalogProduct, type RawProductRow } from "@/lib/products/types";

/**
 * Live catalog hook — the storefront's ONLY product source. Subscribes to
 * the SAME /projects node the admin panel writes, normalizes every row via
 * toCatalogProduct(), and exposes active products sorted for display.
 */
export function useCatalog() {
  const [rows, setRows] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectsRef = ref(database, "projects");
    const unsubscribe = onValue(
      projectsRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, RawProductRow> | null;
        if (!data) {
          setRows([]);
        } else {
          const list = Object.keys(data)
            .map((key) => toCatalogProduct(key, data[key] ?? {}))
            .filter((p) => p.isActive)
            .sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
          setRows(list);
        }
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const products = useMemo(() => rows, [rows]);
  return { products, loading, error };
}
