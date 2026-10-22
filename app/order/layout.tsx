import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Order Status",
  description: "The status of your Timber order.",
  path: "/order",
  noindex: true,
});

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
