import type { MetadataRoute } from "next";
import { fetchAllProducts } from "@/lib/products/server";
import { canonical } from "@/lib/seo";

export const revalidate = 3600; // refresh product URLs hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/categories", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/projects", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/sustainability", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/care", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refund", priority: 0.5, changeFrequency: "monthly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: canonical(path),
    lastModified: new Date("2026-11-01T00:00:00.000Z"),
    changeFrequency,
    priority,
  }));

  const products = await fetchAllProducts();
  const productRoutes = products.map((p) => ({
    url: canonical(`/shop/${p.id}`),
    lastModified: p.updatedAt ? new Date(p.updatedAt) : p.createdAt ? new Date(p.createdAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // /admin, /cart, /checkout, /order are intentionally absent (see robots.ts).
  return [...staticRoutes, ...productRoutes];
}
