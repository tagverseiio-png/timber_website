import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your Cart",
  description: "Review your selected Timber pieces before checkout.",
  path: "/cart",
  noindex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
