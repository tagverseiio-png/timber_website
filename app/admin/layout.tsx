import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Never prerender the admin panel at build time: it requires runtime Firebase
// env vars and must not be statically cached (auth-gated). Route segment
// config must live on a server component — not the "use client" page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Admin",
  description: "Timber store administration.",
  path: "/admin",
  noindex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
