import { toCatalogProduct, type CatalogProduct, type RawProductRow } from "@/lib/products/types";

function restBase(): string | null {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  return base ? base.replace(/\/$/, "") : null;
}

/**
 * Server-side catalog read (homepage featured section). Uses the public RTDB
 * REST endpoint — no Admin SDK, no secrets — with ISR caching (5 min) so
 * repeat visits don't hammer the database.
 *
 * Never throws: build-time prerender (dummy env) and outages resolve to [].
 */
export async function fetchFeaturedProducts(count = 3): Promise<CatalogProduct[]> {
  try {
    const base = restBase();
    if (!base) return [];
    const url =
      `${base.replace(/\/$/, "")}/projects.json` +
      `?orderBy=${encodeURIComponent('"orderIndex"')}&limitToFirst=${count * 4}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, RawProductRow> | null;
    if (!data) return [];
    return Object.keys(data)
      .map((key) => toCatalogProduct(key, data[key] ?? {}))
      .filter((p) => p.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .slice(0, count);
  } catch {
    return [];
  }
}

/** Single product by RTDB key (product pages, sitemap). Null when missing. */
export async function fetchProduct(id: string): Promise<CatalogProduct | null> {
  try {
    const base = restBase();
    if (!base || !id) return null;
    const res = await fetch(`${base}/projects/${encodeURIComponent(id)}.json`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const row = (await res.json()) as RawProductRow | null;
    if (!row) return null;
    const product = toCatalogProduct(id, row);
    return product.isActive ? product : null;
  } catch {
    return null;
  }
}

/** Full active catalog (sitemap). Never throws. */
export async function fetchAllProducts(): Promise<CatalogProduct[]> {
  try {
    const base = restBase();
    if (!base) return [];
    const res = await fetch(`${base}/projects.json`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, RawProductRow> | null;
    if (!data) return [];
    return Object.keys(data)
      .map((key) => toCatalogProduct(key, data[key] ?? {}))
      .filter((p) => p.isActive);
  } catch {
    return [];
  }
}
