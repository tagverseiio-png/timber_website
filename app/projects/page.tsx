"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";
import Link from "next/link";

const PROJECTS = [
  {
    id: 1,
    title: "The Log Timber Roof",
    type: "Signature Build",
    description:
      "A roof framed entirely from natural logs, each chosen for its strength and character. Where our craft begins, and the standard for every piece we make.",
    // Replace with your own roof photo (put it in /public/images/projects/)
    image: "/images/projects/timber-roof.jpg",
  },
  {
    id: 2,
    title: "Downtown Loft",
    type: "Living & Dining",
    description: "A live-edge dining table anchoring an open urban space.",
    image: "https://images.unsplash.com/photo-1556020685-e6319502f689?q=80&w=1500&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Coastal Retreat",
    type: "Bedroom",
    description: "A hand-joined timber bed in soft, sun-bleached tones.",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1500&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Creative Studio",
    type: "Office",
    description: "A solid wood desk and shelving built for long working days.",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1500&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Urban Oasis",
    type: "Outdoor",
    description: "Weather-ready timber seating for terraces and gardens.",
    image: "https://images.unsplash.com/photo-1581428982868-e410dd98fc19?q=80&w=1500&auto=format&fit=crop",
  },
];

export default function ProjectsPage() {
  return (
    <div className="bg-timber-beige min-h-screen pt-24 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        <ScrollReveal className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">
            Built from the Log Up
          </h1>
          <p className="text-timber-muted max-w-2xl mx-auto">
            From raw log roofs to finished dining tables, every Timber project starts with the
            same thing: real wood, shaped by hand. Explore the spaces we&apos;ve built and furnished.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-[400px]">
          {PROJECTS.map((project, index) => (
            <ScrollReveal
              key={project.id}
              delay={index * 0.1}
              className={`group relative overflow-hidden interactive ${index === 0 ? "md:col-span-2 md:row-span-2" : ""
                } ${index === 3 ? "lg:col-span-2" : ""}`}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

              <div className="absolute bottom-0 left-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-timber-beige/80 text-xs tracking-widest uppercase mb-2 block">
                  {project.type}
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-white">{project.title}</h3>
                <p
                  className={`text-white/80 mt-3 max-w-md text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${index === 0 ? "md:text-base" : ""
                    }`}
                >
                  {project.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA strip */}
        <ScrollReveal className="text-center mt-24">
          <h2 className="font-serif text-3xl md:text-4xl text-timber-darkwood mb-3">
            Have a space in mind?
          </h2>
          <p className="text-timber-muted max-w-xl mx-auto mb-8">
            We build custom timber pieces to fit your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="interactive px-8 py-3 bg-timber-darkwood text-timber-beige tracking-wide"
            >
              Shop Furniture
            </Link>
            <Link
              href="/contact"
              className="interactive px-8 py-3 border border-timber-darkwood text-timber-darkwood tracking-wide"
            >
              Request a Custom Piece
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}