import type { Timestamp } from "firebase/firestore";

/**
 * Canonical Firestore gallery image record stored in the `gallery` collection.
 * Binary image assets live in Firebase Storage under `gallery/<filename>`.
 */
export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  orderIndex: number;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export type RawGalleryDoc = Record<string, unknown>;

export const GALLERY_CATEGORIES = [
  "Living Room",
  "Bedroom",
  "Dining",
  "Entertainment",
  "Outdoor",
  "Craftsmanship",
  "Custom Projects",
  "Showroom",
  "Other",
] as const;

export const MAX_GALLERY_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_GALLERY_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

function toMillis(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    value !== null &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as Timestamp).toMillis === "function"
  ) {
    return (value as Timestamp).toMillis();
  }
  return undefined;
}

/** Normalize a Firestore document snapshot into a typed GalleryItem. */
export function toGalleryItem(id: string, raw: RawGalleryDoc): GalleryItem {
  const orderNum = Number(raw.orderIndex);
  const sizeNum = Number(raw.fileSize);

  return {
    id,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : "Untitled Photo",
    description: typeof raw.description === "string" ? raw.description : "",
    category: typeof raw.category === "string" && raw.category.trim() ? raw.category : "Other",
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    storagePath: typeof raw.storagePath === "string" ? raw.storagePath : "",
    fileName: typeof raw.fileName === "string" ? raw.fileName : "",
    fileSize: Number.isFinite(sizeNum) && sizeNum >= 0 ? sizeNum : 0,
    contentType: typeof raw.contentType === "string" ? raw.contentType : "image/jpeg",
    orderIndex: Number.isInteger(orderNum) && orderNum >= 0 ? orderNum : 0,
    isActive: raw.isActive !== false,
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt),
  };
}

/** Derive a clean display title from a local file name. */
export function titleFromFilename(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (!stem) return "Gallery Photo";
  return stem
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 120);
}

/** Format byte size for compact display in admin cards. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Validate file type and 5 MB storage limit before uploading. */
export function validateGalleryFile(file: File): string | null {
  if (!ALLOWED_GALLERY_MIME_TYPES.includes(file.type as (typeof ALLOWED_GALLERY_MIME_TYPES)[number])) {
    return `"${file.name}": Only JPG, PNG, or WebP images are allowed.`;
  }
  if (file.size > MAX_GALLERY_UPLOAD_BYTES) {
    return `"${file.name}": File must be under 5 MB.`;
  }
  return null;
}

