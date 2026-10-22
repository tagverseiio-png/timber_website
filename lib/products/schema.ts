import { z } from "zod";

/**
 * Admin product FORM schema.
 *
 * Humans think in rupees: the form edits `priceRupees` / `compareAtRupees`.
 * On save these are converted to integer paise (see rupeesToPaise) and stored
 * as the canonical CatalogProduct (lib/products/types.ts). Money is NEVER
 * stored as float.
 */
export const productSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(120),
  priceRupees: z
    .number({ error: "Price must be a number" })
    .finite("Price must be a number")
    .nonnegative("Price cannot be negative")
    .max(10_000_000, "Price looks too large"),
  compareAtRupees: z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? undefined : v),
    z.number().finite().nonnegative().max(10_000_000).optional()
  ),
  category: z.string().trim().min(1, "Pick a category"),
  type: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  /** Primary image URL (uploaded to Storage); saved as images[0]. */
  image: z.string().trim().optional().default(""),
  /** Whole units, or empty = stock untracked (made-to-order). */
  stock: z
    .string()
    .trim()
    .max(7)
    .refine((v) => v === "" || /^\d+$/.test(v), "Whole units, or leave empty")
    .optional()
    .default(""),
  orderIndex: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** What react-hook-form holds (pre-default, hence possibly undefined). */
export type ProductFormInput = z.input<typeof productSchema>;

export const PRODUCT_CATEGORIES = [
  "2 Seaters",
  "3 Seaters",
  "Bar Units",
  "Book Shelves",
  "Buffets",
  "Chest Boxes",
  "Chest of Draws",
  "Diwans",
  "Misc",
  "Outdoor",
  "Puja Units",
  "Shoe Racks",
  "Showcases",
  "Sofas",
  "Wardrobes",
  "Souvenirs",
  "Cots",
  "Chairs",
  "Wallmounts and Mirrors",
] as const;
