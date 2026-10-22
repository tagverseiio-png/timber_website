import type { MetadataRoute } from "next";
import { fetchAllProducts } from "@/lib/products/server";
import { canonical } from "@/lib/seo";

export const revalidate = 3600; // refresh product URLs hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/shop", "/categories", "/projects", "/about", "/contact"].map(
    (path) => ({
      url: canonical(path),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    })
  );

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
