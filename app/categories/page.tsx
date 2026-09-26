"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { name: "2 Seaters", image: "/images/2%20seater.jpg", link: "/shop?category=2 Seaters" },
  { name: "3 Seaters", image: "/images/3%20seater.jpg", link: "/shop?category=3 Seaters" },
  { name: "Bar Units", image: "/images/bar_unit.jpg", link: "/shop?category=Bar Units" },
  { name: "Book Shelves", image: "/images/bookshelf.jpg", link: "/shop?category=Book Shelves" },
  { name: "Buffets", image: "/images/buffet.jpg", link: "/shop?category=Buffets" },
  { name: "Chest Boxes", image: "/images/chest_box.jpg", link: "/shop?category=Chest Boxes" },
  { name: "Chest of Draws", image: "/images/chest_of_draws.jpg", link: "/shop?category=Chest of Draws" },
  { name: "Diwans", image: "/images/diwans.jpg", link: "/shop?category=Diwans" },
  { name: "Misc", image: "/images/misc.JPG", link: "/shop?category=Misc" },
  { name: "Outdoor", image: "/images/outdoor.jpg", link: "/shop?category=Outdoor" },
  { name: "Puja Units", image: "/images/puja_unit.jpg", link: "/shop?category=Puja Units" },
  { name: "Shoe Racks", image: "/images/shoe_rack.jpg", link: "/shop?category=Shoe Racks" },
  { name: "Showcases", image: "/images/showcase.jpg", link: "/shop?category=Showcases" },
  { name: "Sofas", image: "/images/sofa.JPG", link: "/shop?category=Sofas" },
  { name: "Wardrobes", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=1500&auto=format&fit=crop", link: "/shop?category=Wardrobes" },
  { name: "Souvenirs", image: "/images/souvenier.jpg", link: "/shop?category=Souvenirs" },
  { name: "Wallmounts and Mirrors", image: "/images/mirror.jpg", link: "/shop?category=Wallmounts and Mirrors" },
  { name: "Cots", image: "/images/cots.jpg", link: "/shop?category=Cots" },
  { name: "Chairs", image: "/images/chair.jpg", link: "/shop?category=Chairs" },
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
                  className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
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
