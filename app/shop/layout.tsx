import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop Handcrafted Timber Furniture",
  description:
    "Browse the full Timber collection — solid-wood sofas, tables, beds, chairs, storage and more. Handcrafted, sustainably sourced, made to last.",
  path: "/shop",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
