import { HeroSection } from "@/components/ui/HeroSection";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimberStory } from "@/components/ui/TimberStory";
import { ProductCard } from "@/components/ui/ProductCard";
import { StatsStrip } from "@/components/ui/StatsStrip";
import { CinematicIntro } from "@/components/ui/CinematicIntro";
import { WoodShavingCursor } from "@/components/layout/WoodShavingCursor";
import Image from "next/image";

// Mock products for the homepage showcase
const featuredProducts = [
  {
    id: "prod-1",
    name: "The Artisan Dining Table",
    price: 2400,
    woodType: "Solid Oak",
    image: "/images/media_1789477358584.jpg",
    rating: 5,
    category: "Tables"
  },
  {
    id: "prod-2",
    name: "Classic Timber Bedframe",
    price: 1850,
    woodType: "Mahogany",
    image: "/images/book_self.jpg",
    rating: 4.8,
    category: "Beds"
  },
  {
    id: "prod-3",
    name: "Ornate Reading Chair",
    price: 850,
    woodType: "Walnut & Leather",
    image: "/images/media_1789478474046.png",
    rating: 4.9,
    category: "Chairs"
  }
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-timber-beige">
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
                afterImage="/images/media_1789476566304.jpg"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Animated Stats Strip */}
      <StatsStrip />

      {/* Featured Products Showcase */}
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
    </main>
  );
}
