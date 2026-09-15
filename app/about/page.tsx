"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-timber-beige min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center -mt-24 pt-24 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1582229555627-c10ce76cc638?q=80&w=2000&auto=format&fit=crop"
          alt="Craftsmanship"
          fill
          className="object-cover brightness-75"
        />
        <div className="relative z-10 text-center">
          <ScrollReveal>
            <h1 className="font-serif text-5xl md:text-7xl text-timber-beige mb-4">Our Story</h1>
            <p className="text-timber-beige/90 text-lg uppercase tracking-widest">Rooted in Nature</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <ScrollReveal direction="right">
            <h2 className="font-serif text-4xl text-timber-darkwood mb-6">Generations of Craft</h2>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              Timber was born out of a simple belief: that furniture should be built to last a lifetime, 
              honoring the natural beauty of the materials used. Our journey began in a small workshop, 
              where our founders learned the traditional techniques of wood joinery from their ancestors.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed">
              Today, we combine those time-honored methods with modern precision, creating pieces that 
              are both structurally sound and visually striking.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="left" className="relative aspect-square md:aspect-[3/4]">
            <Image
              src="https://images.unsplash.com/photo-1611145320501-837acbba39f7?q=80&w=1500&auto=format&fit=crop"
              alt="Workshop"
              fill
              className="object-cover"
            />
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal direction="right" className="relative aspect-square md:aspect-[3/4] order-2 md:order-1">
            <Image
              src="https://images.unsplash.com/photo-1623910271000-5847e3d81dc3?q=80&w=1500&auto=format&fit=crop"
              alt="Sustainable Timber"
              fill
              className="object-cover"
            />
          </ScrollReveal>
          <ScrollReveal direction="left" className="order-1 md:order-2">
            <h2 className="font-serif text-4xl text-timber-darkwood mb-6">Sustainable Sourcing</h2>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              We respect the forest. Every piece of wood we use is traced back to sustainably managed forests 
              where harvesting is carefully planned to ensure the ecosystem thrives.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed">
              We focus on local woods like Walnut, Oak, and Ash, minimizing our carbon footprint while 
              delivering unparalleled quality to your home.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
