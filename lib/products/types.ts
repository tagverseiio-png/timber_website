import { legacyRupeesToPaise } from "@/lib/money";

/**
 * CANONICAL PRODUCT SCHEMA (v2) — the single contract shared by the admin
 * panel, the storefront, the cart (Phase 5) and SEO (Phase 6).
 *
 *   {
 *     id, name, slug, description,
 *     pricePaise (integer), compareAtPricePaise?, currency: "INR",
 *     stock (integer | null; null = untracked / made-to-order legacy rows),
 *     images[], category, type?, isActive,
 *     orderIndex, createdAt?, updatedAt?
 *   }
 *
 * Readers MUST go through `toCatalogProduct()`, which also accepts legacy
 * v1 rows ({title, price: float ₹, image}) so old data keeps working until
 * server/migrate-catalog-paise.mjs is run.
 */

export interface CatalogProduct {
  /** RTDB key under /projects (stable identity used by /shop/[id]). */
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Integer paise. All math (cart totals, Razorpay amounts) uses this. */
  pricePaise: number;
  compareAtPricePaise?: number;
  currency: string;
  /** Null = stock not tracked (legacy / made-to-order). */
  stock: number | null;
  images: string[];
  category: string;
  /** Display grouping, e.g. "Living Room". */
  type: string;
  isActive: boolean;
  orderIndex: number;
  createdAt?: number;
  updatedAt?: number;
}

/** Raw RTDB row: canonical fields and/or legacy v1 fields. */
export type RawProductRow = Record<string, unknown>;

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return slug || "product";
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
}

/** Normalize one RTDB row (v1 legacy or v2 canonical) into CatalogProduct. */
export function toCatalogProduct(key: string, raw: RawProductRow): CatalogProduct {
  const pricePaise = Number.isInteger(raw.pricePaise)
    ? (raw.pricePaise as number)
    : legacyRupeesToPaise(raw.price);

  const rawCompare = raw.compareAtPricePaise ?? raw.compareAtPrice;
  const compareAtPricePaise =
    rawCompare === undefined || rawCompare === null
      ? undefined
      : Number.isInteger(raw.compareAtPricePaise)
        ? (raw.compareAtPricePaise as number)
        : legacyRupeesToPaise(rawCompare);

  const images = Array.isArray(raw.images)
    ? (raw.images as unknown[]).filter((u): u is string => typeof u === "string" && u.length > 0)
    : typeof raw.image === "string" && raw.image.length > 0
      ? [raw.image]
      : [];

  const name = asString(raw.name) || asString(raw.title) || "Untitled product";

  const stockRaw = raw.stock;
  const stock =
    stockRaw === undefined || stockRaw === null || stockRaw === ""
      ? null
      : asInt(stockRaw, 0);

  return {
    id: key,
    name,
    slug: asString(raw.slug) || slugify(name),
    description: asString(raw.description),
    pricePaise,
    ...(compareAtPricePaise !== undefined ? { compareAtPricePaise } : {}),
    currency: asString(raw.currency, "INR"),
    stock,
    images,
    category: asString(raw.category),
    type: asString(raw.type),
    isActive: raw.isActive !== false, // legacy rows predate soft-delete
    orderIndex: asInt(raw.orderIndex, 0),
    ...(typeof raw.createdAt === "number" ? { createdAt: raw.createdAt } : {}),
    ...(typeof raw.updatedAt === "number" ? { updatedAt: raw.updatedAt } : {}),
  };
}

/** Flow reference (how name/price/currency travel):
 *  admin form (₹ string/number) → rupeesToPaise() → RTDB `pricePaise` (int)
 *  → toCatalogProduct() → storefront/cart → formatPrice() (display only)
 *  → checkout sends ONLY {id, qty} to the VM; the VM re-reads `pricePaise`
 *  with the Admin SDK and amounts Razorpay in paise. */
