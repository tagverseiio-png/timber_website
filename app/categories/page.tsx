"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { name: "Tables", image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=tables" },
  { name: "Chairs", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=chairs" },
  { name: "Beds", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=beds" },
  { name: "Cabinets", image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=cabinets" },
  { name: "Outdoor", image: "https://images.unsplash.com/photo-1522771731478-44fb19a868a1?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=outdoor" },
  { name: "Custom", image: "https://images.unsplash.com/photo-1610398000003-1498b8ed6df4?q=80&w=1500&auto=format&fit=crop", link: "/contact" },
];

export default function CategoriesPage() {
  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        <ScrollReveal className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">Categories</h1>
          <p className="text-timber-muted max-w-2xl mx-auto">
            Explore our collections tailored for every space in your home.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CATEGORIES.map((cat, i) => (
            <ScrollReveal key={cat.name} delay={i * 0.1} className="group relative aspect-[4/3] md:aspect-[16/9] overflow-hidden interactive">
              <Link href={cat.link}>
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="font-serif text-4xl text-white tracking-widest">{cat.name}</h2>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
