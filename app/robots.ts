import type { MetadataRoute } from "next";
import { canonical } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/cart", "/checkout", "/order"],
      },
    ],
    sitemap: canonical("/sitemap.xml"),
  };
}
