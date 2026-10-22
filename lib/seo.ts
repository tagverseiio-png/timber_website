import type { Metadata } from "next";

/**
 * SEO helpers — one place for site URL, canonical URLs and page metadata.
 * Canonical prefers NEXT_PUBLIC_SITE_URL, falls back to Vercel's automatic
 * URL, then localhost (local dev only — never correct in production).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "Timber";

export function canonical(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const url = canonical(path);
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: canonical("/images/logo.png"), alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [canonical("/images/logo.png")],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
