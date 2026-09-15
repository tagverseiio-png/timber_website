import { HeroSection } from "@/components/ui/HeroSection";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-timber-beige">
      {/* Hero Section */}
      <HeroSection />

      {/* Timber Story Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="w-full md:w-1/2">
              <div className="aspect-square relative rounded-full overflow-hidden border-8 border-timber-darkwood/50 group">
                <Image
                  src="/images/media_1789478474046.png"
                  alt="Crafting timber"
                  fill
                  className="object-cover scale-110 group-hover:scale-100 transition-transform duration-[1500ms] ease-out"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col items-start text-timber-darkwood">
              <h2 className="text-sm tracking-[0.2em] uppercase font-semibold text-timber-teal mb-4">The Timber Story</h2>
              <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8 leading-tight">
                Roots in nature, refined for your home.
              </h3>
              <p className="text-lg text-timber-darkwood/80 mb-6 font-light leading-relaxed">
                Every piece of timber has a story to tell. We source only the finest, sustainably harvested natural wood, honoring its unique grain and character. 
              </p>
              <p className="text-lg text-timber-darkwood/80 mb-10 font-light leading-relaxed">
                Our master artisans combine traditional craftsmanship with modern design principles, transforming raw logs into timeless centerpieces for your living space.
              </p>
              <button className="border-b border-timber-darkwood pb-1 font-medium hover:text-timber-teal hover:border-timber-teal transition-colors uppercase tracking-widest text-sm">
                Read our story
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

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
                beforeImage="/images/media_1789477358584.jpg"
                afterImage="/images/media_1789476566304.jpg"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
