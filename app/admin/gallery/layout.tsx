import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Gallery Management",
  description: "Timber gallery photo administration.",
  path: "/admin/gallery",
  noindex: true,
});

export default function AdminGalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

