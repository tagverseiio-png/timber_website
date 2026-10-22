"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowRight, Hammer, Sparkles, Compass } from "lucide-react";

export default function ShopPage() {
  return (
    <div className="bg-timber-beige min-h-screen pt-12 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <ScrollReveal className="mb-16 max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-timber-teal font-medium mb-3 block">
            Timber Atelier
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-timber-darkwood mb-6">
            The Collection
          </h1>
          <p className="text-timber-muted text-lg leading-relaxed">
            Discover our range of premium handcrafted timber furniture. Every piece is shaped from sustainable solid wood, built to bring warmth, character, and generational longevity to your living spaces.
          </p>
        </ScrollReveal>

        {/* Curation & Bespoke Services */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <ScrollReveal delay={0.1} direction="up">
            <div className="h-full bg-white/70 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 flex flex-col justify-between hover:border-timber-teal/40 transition-all hover:shadow-md">
              <div>
                <div className="w-12 h-12 rounded-xl bg-timber-teal/10 text-timber-teal flex items-center justify-center mb-6">
                  <Hammer size={24} />
                </div>
                <h3 className="font-serif text-2xl text-timber-darkwood mb-3">
                  Bespoke Commissions
                </h3>
                <p className="text-timber-muted text-sm leading-relaxed mb-6">
                  Looking for custom dimensions, specific timber grains, or tailored architectural joinery? Our artisans build one-of-a-kind pieces to your exact specifications.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center text-sm font-medium text-timber-teal hover:text-timber-darkwood transition-colors group interactive"
              >
                Inquire for Custom Work
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="up">
            <div className="h-full bg-white/70 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 flex flex-col justify-between hover:border-timber-teal/40 transition-all hover:shadow-md">
              <div>
                <div className="w-12 h-12 rounded-xl bg-timber-teal/10 text-timber-teal flex items-center justify-center mb-6">
                  <Compass size={24} />
                </div>
                <h3 className="font-serif text-2xl text-timber-darkwood mb-3">
                  Projects & Gallery
                </h3>
                <p className="text-timber-muted text-sm leading-relaxed mb-6">
                  Explore installations, living room centerpieces, dining sets, and outdoor sanctuaries built by our workshop for private residences and architects.
                </p>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center text-sm font-medium text-timber-teal hover:text-timber-darkwood transition-colors group interactive"
              >
                Explore Gallery
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} direction="up">
            <div className="h-full bg-white/70 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 flex flex-col justify-between hover:border-timber-teal/40 transition-all hover:shadow-md">
              <div>
                <div className="w-12 h-12 rounded-xl bg-timber-teal/10 text-timber-teal flex items-center justify-center mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-serif text-2xl text-timber-darkwood mb-3">
                  Our Story & Craft
                </h3>
                <p className="text-timber-muted text-sm leading-relaxed mb-6">
                  Learn about our wood selection, sustainable harvesting practices, and hand-finishing techniques that preserve the natural soul of every timber slab.
                </p>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center text-sm font-medium text-timber-teal hover:text-timber-darkwood transition-colors group interactive"
              >
                Discover the Craft
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Featured Banner / Call to Action */}
        <ScrollReveal delay={0.4} direction="up">
          <div className="rounded-3xl bg-timber-teal text-white p-10 md:p-14 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs uppercase tracking-widest text-timber-beige/80 font-medium mb-3 block">
                Direct Workshop Consultations
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
                Ready to bring timber into your space?
              </h2>
              <p className="text-timber-beige/80 text-sm md:text-base leading-relaxed mb-8">
                Whether you need a consultation on dimensions, timber species, or live catalog availability, our workshop team is ready to guide you.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="bg-timber-beige text-timber-teal hover:bg-white transition-colors rounded-full px-7 py-3 text-sm font-medium interactive"
                >
                  Contact Our Artisans
                </Link>
                <Link
                  href="/projects"
                  className="border border-timber-beige/40 text-white hover:bg-white/10 transition-colors rounded-full px-7 py-3 text-sm font-medium interactive"
                >
                  View Showcase Gallery
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
