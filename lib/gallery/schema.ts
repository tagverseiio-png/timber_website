import { z } from "zod";

/**
 * Admin gallery metadata validation schema used for editing and upload metadata.
 */
export const galleryItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
  description: z.string().trim().max(1000, "Description must be 1000 characters or less").optional().default(""),
  category: z.string().trim().min(1, "Pick a category"),
  orderIndex: z.number().int("Whole number required").nonnegative("Order must be 0 or higher").default(0),
  isActive: z.boolean().default(true),
});

export type GalleryItemFormValues = z.infer<typeof galleryItemSchema>;
export type GalleryItemFormInput = z.input<typeof galleryItemSchema>;

