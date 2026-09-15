import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimberGrainEffect } from "@/components/ui/TimberGrainEffect";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { ProductCard, Product } from "@/components/ui/ProductCard";

// Mock data
const FEATURED_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "The Artisan Dining Table",
    price: 2400,
    woodType: "Solid Walnut",
    image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=1000&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=1000&auto=format&fit=crop",
    rating: 5,
    category: "tables"
  },
  {
    id: "2",
    name: "Lounge Chair Noir",
    price: 850,
    originalPrice: 1100,
    woodType: "Black Ash",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1000&auto=format&fit=crop",
    rating: 4.8,
    category: "chairs"
  },
  {
    id: "3",
    name: "Minimalist Platform Bed",
    price: 1800,
    woodType: "White Oak",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1522771731478-44fb19a868a1?q=80&w=1000&auto=format&fit=crop",
    rating: 4.9,
    category: "beds"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative h-screen w-full flex items-center justify-center pt-20 -mt-24">
        <Image
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop"
          alt="Premium Timber Furniture"
          fill
          className="object-cover absolute inset-0 z-0 brightness-75"
          priority
        />
        
        <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <ScrollReveal delay={0.2}>
            <div className="overflow-hidden h-24 sm:h-32 mb-4">
              <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl text-timber-beige tracking-tight animate-fade-in-up">
                Crafted by <span className="italic">Nature.</span>
              </h1>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.4}>
            <p className="text-lg md:text-xl text-timber-beige/90 max-w-2xl mx-auto mb-10 font-light tracking-wide">
              We create premium furniture from carefully selected natural timber. 
              Built to last generations, designed for the modern home.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                href="/shop" 
                className="px-8 py-4 bg-timber-beige text-timber-darkwood font-medium tracking-wider uppercase text-sm hover:bg-white transition-colors interactive"
              >
                Explore Collection
              </Link>
              <Link 
                href="/about" 
                className="px-8 py-4 bg-transparent border border-timber-beige text-timber-beige font-medium tracking-wider uppercase text-sm hover:bg-timber-beige/10 transition-colors interactive"
              >
                Discover Our Craft
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-32 bg-timber-cream relative z-10">
        <div className="container mx-auto px-6 md:px-12">
          <ScrollReveal className="flex justify-between items-end mb-16">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">Signature Pieces</h2>
              <p className="text-timber-muted max-w-md">Explore our most loved furniture, handcrafted to perfection.</p>
            </div>
            <Link href="/shop" className="hidden md:flex items-center gap-2 text-timber-teal hover:text-timber-darkwood transition-colors pb-2 border-b border-transparent hover:border-timber-darkwood interactive font-medium">
              View All
            </Link>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {FEATURED_PRODUCTS.map((product, index) => (
              <ScrollReveal key={product.id} delay={0.2 * (index + 1)} direction="up">
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* TIMBER STORY / INTERACTIVE GRAIN */}
      <section className="py-24 bg-timber-darkwood text-timber-beige relative overflow-hidden">
        <TimberGrainEffect className="absolute inset-0 z-0" />
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="right">
              <div className="aspect-square relative rounded-full overflow-hidden border-8 border-timber-darkwood/50">
                <Image
                  src="https://images.unsplash.com/photo-1610398000003-1498b8ed6df4?q=80&w=1500&auto=format&fit=crop"
                  alt="Crafting timber"
                  fill
                  className="object-cover"
                />
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="left">
              <h2 className="font-serif text-4xl md:text-6xl mb-8">The Timber Story</h2>
              <p className="text-timber-beige/80 text-lg mb-6 leading-relaxed">
                Every piece of furniture begins its journey deep in responsibly managed forests. 
                We select only the finest natural wood, celebrating its unique grain, texture, and character.
              </p>
              <p className="text-timber-beige/80 text-lg mb-10 leading-relaxed">
                Our master craftsmen spend hours shaping, sanding, and finishing the timber, 
                ensuring the natural beauty is preserved while achieving a flawless, modern aesthetic.
              </p>
              <Link 
                href="/about" 
                className="inline-block border-b border-timber-beige pb-1 text-timber-beige hover:text-white hover:border-white transition-all interactive uppercase tracking-wider text-sm"
              >
                Read Our Story
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER TRANSFORMATION */}
      <section className="py-32 bg-timber-beige">
        <div className="container mx-auto px-6 md:px-12">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">Transformation</h2>
            <p className="text-timber-muted max-w-2xl mx-auto">
              Drag the slider to see how we transform raw, natural timber into refined premium furniture.
            </p>
          </ScrollReveal>
          
          <ScrollReveal>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-timber-darkwood/10 border border-timber-darkwood/5">
              <BeforeAfterSlider 
                beforeImage="https://images.unsplash.com/photo-1582229555627-c10ce76cc638?q=80&w=1600&auto=format&fit=crop"
                afterImage="https://images.unsplash.com/photo-1616464916356-3a40021c7811?q=80&w=1600&auto=format&fit=crop"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
      
      {/* SUSTAINABILITY */}
      <section className="py-24 bg-timber-teal text-white">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <ScrollReveal>
            <h2 className="font-serif text-4xl md:text-5xl mb-6">Designed with Purpose</h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg mb-10">
              We believe in creating furniture that doesn't cost the earth. All our timber is sourced from 
              certified sustainable forests, and we plant two trees for every piece we create.
            </p>
            <Link 
              href="/sustainability" 
              className="px-8 py-4 bg-white text-timber-teal font-medium tracking-wider uppercase text-sm hover:bg-timber-beige transition-colors interactive inline-block"
            >
              Our Sustainability Promise
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
