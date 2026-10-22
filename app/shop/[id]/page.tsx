import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProduct } from "@/lib/products/server";
import { canonical, SITE_NAME } from "@/lib/seo";
import { ProductDetailView } from "@/components/ui/ProductDetailView";

export const revalidate = 300; // product edits go live within 5 minutes

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) return { title: "Product not found", robots: { index: false } };

  const description = product.description
    ? product.description.slice(0, 155)
    : `${product.name} — handcrafted ${product.category} from Timber. Solid wood, sustainably sourced.`;
  const url = canonical(`/shop/${product.id}`);
  const title = `${product.name} | ${SITE_NAME}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(product.images[0] ? { images: [{ url: product.images[0], alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(product.images[0] ? { images: [product.images[0]] } : {}),
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  // Product structured data: price in major units (decimal), availability
  // from tracked stock (untracked legacy = InStock, made-to-order).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.length > 0 ? product.images : undefined,
    sku: product.id,
    category: product.category || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: (Math.round(product.pricePaise) / 100).toFixed(2),
      availability:
        product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: canonical(`/shop/${product.id}`),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} />
    </>
  );
}
