"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { name: "2 Seaters", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=2 Seaters" },
  { name: "3 Seaters", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=3 Seaters" },
  { name: "Bar Units", image: "https://images.unsplash.com/photo-1517581177682-a085bc7fcb10?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Bar Units" },
  { name: "Book Shelves", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Book Shelves" },
  { name: "Buffets", image: "https://images.unsplash.com/photo-1558211583-d26f610c1eb1?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Buffets" },
  { name: "Chest Boxes", image: "https://images.unsplash.com/photo-1595514535311-667dc9ceafba?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Chest Boxes" },
  { name: "Chest of Draws", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Chest of Draws" },
  { name: "Diwans", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Diwans" },
  { name: "Misc", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Misc" },
  { name: "Outdoor", image: "https://images.unsplash.com/photo-1522771731478-44fb19a868a1?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Outdoor" },
  { name: "Puja Units", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Puja Units" },
  { name: "Shoe Racks", image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Shoe Racks" },
  { name: "Showcases", image: "https://images.unsplash.com/photo-1606744887128-0925e01f5c6e?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Showcases" },
  { name: "Sofas", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Sofas" },
  { name: "Wardrobes", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Wardrobes" },
  { name: "Souvenirs", image: "https://images.unsplash.com/photo-1588623696803-e8faec3a3028?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Souvenirs" },
  { name: "Cots", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Cots" },
  { name: "Chairs", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Chairs" },
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
