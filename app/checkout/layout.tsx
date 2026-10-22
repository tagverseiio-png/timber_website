import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Securely complete your Timber purchase via Razorpay.",
  path: "/checkout",
  noindex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
