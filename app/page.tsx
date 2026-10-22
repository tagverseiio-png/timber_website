import { HeroSection } from "@/components/ui/HeroSection";
import dynamic from "next/dynamic";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimberStory } from "@/components/ui/TimberStory";
import { ProductCard } from "@/components/ui/ProductCard";
import { StatsStrip } from "@/components/ui/StatsStrip";
import { WoodShavingCursor } from "@/components/layout/WoodShavingCursor";
import { fetchFeaturedProducts } from "@/lib/products/server";
import { canonical } from "@/lib/seo";

// Split from the initial bundle: the intro is a fixed overlay and the
// slider sits far below the fold. Both are SSR-safe ("use client" with
// window/sessionStorage access inside effects only), so plain dynamic()
// code-splits without removing them from server HTML (no CLS/SEO cost).
const CinematicIntro = dynamic(
  () => import("@/components/ui/CinematicIntro").then((m) => m.CinematicIntro)
);
const BeforeAfterSlider = dynamic(
  () => import("@/components/ui/BeforeAfterSlider").then((m) => m.BeforeAfterSlider)
);
// Live data: the SAME /projects node the admin panel writes (ISR, 5 min).
// Falls back to an empty section at build time / on outage.
export default async function Home() {
  const featuredProducts = await fetchFeaturedProducts(3);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Timber Furniture Co.",
    url: canonical("/"),
    logo: canonical("/images/logo.png"),
    description:
      "Premium handcrafted timber furniture — sustainably sourced solid wood, built for generations.",
  };

  return (
    <main className="flex min-h-screen flex-col bg-timber-beige">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <CinematicIntro />
      <WoodShavingCursor />
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
