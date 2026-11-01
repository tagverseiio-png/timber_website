import { HeroSection } from "@/components/ui/HeroSection";
import dynamic from "next/dynamic";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimberStory } from "@/components/ui/TimberStory";
import { ProductCard } from "@/components/ui/ProductCard";
import { StatsStrip } from "@/components/ui/StatsStrip";
import { fetchFeaturedProducts } from "@/lib/products/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { canonical } from "@/lib/seo";

// Split from the initial bundle: the slider sits far below the fold.
// SSR-safe ("use client" with window/sessionStorage access inside effects only),
// so plain dynamic() code-splits without removing it from server HTML (no CLS/SEO cost).
const BeforeAfterSlider = dynamic(
  () => import("@/components/ui/BeforeAfterSlider").then((m) => m.BeforeAfterSlider)
);
// Live data: the SAME /projects node the admin panel writes (ISR, 5 min).
// Falls back to an empty section at build time / on outage.
export default async function Home() {
  const featuredProducts = await fetchFeaturedProducts(3);

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: "Timber, House of Exclusive",
    alternateName: "Timber Furniture Co.",
    url: canonical("/"),
    logo: canonical("/images/logo.png"),
    image: canonical("/images/about-first-image.jpeg"),
    description:
      "Premium handcrafted timber furniture — sustainably sourced solid wood, built for generations.",
    telephone: "+91-9962004546",
    priceRange: "₹₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "7/1, Basement, Kodambakkam High Rd, Tirumurthy Nagar",
      addressLocality: "Nungambakkam, Chennai",
      addressRegion: "Tamil Nadu",
      postalCode: "600034",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.0569,
      longitude: 80.2425,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "10:00",
        closes: "20:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        opens: "10:30",
        closes: "18:00",
      },
    ],
  };

  return (
    <main className="flex min-h-screen flex-col bg-timber-beige">
      <JsonLd json={storeJsonLd} />
      {/* Hero Section */}
      <HeroSection />

      {/* Timber Story Section (Scroll Pinned) */}
      <TimberStory />

      {/* Transformation Section (Before/After) */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-timber-darkwood text-timber-beige relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-sm tracking-[0.2em] uppercase font-semibold text-timber-beige/60 mb-4">The Transformation</h2>
              <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6">From Forest to Furniture</h3>
              <p className="max-w-2xl mx-auto text-timber-beige/80 text-lg font-light">
                Slide to see how we uncover the natural beauty hidden within raw timber, crafting it into an elegant finished piece.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-timber-beige/10">
              <BeforeAfterSlider
                beforeImage="/images/left_side%20_image.png"
                afterImage="/images/right_side_image.jpg"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Animated Stats Strip */}
      <StatsStrip />

      {/* Featured Products Showcase (hidden when the catalog is empty) */}
      {featuredProducts.length > 0 && (
      <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
        <ScrollReveal>
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-sm tracking-[0.2em] uppercase font-semibold text-timber-teal mb-4">Featured Collection</h2>
            <h3 className="font-serif text-4xl md:text-5xl">Handcrafted Excellence</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </ScrollReveal>
      </section>
      )}
    </main>
  );
}
