import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Furniture Categories",
  description:
    "Explore every Timber collection — sofas, beds, dining, storage, outdoor and decor — tailored for every space in your home.",
  path: "/categories",
});

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
