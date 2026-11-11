"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { subscribePublicGalleryPhotos } from "@/lib/gallery/service";
import { GALLERY_CATEGORIES, type GalleryItem } from "@/lib/gallery/types";

export default function ProjectsPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const unsubscribe = subscribePublicGalleryPhotos(
      (nextItems) => {
        setItems(nextItems);
        setError(null);
        setLoading(false);
      },
      (errMessage) => {
        setError(errMessage);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const categories = useMemo(() => {
    const used = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
    const ordered = [
      ...GALLERY_CATEGORIES.filter((cat) => used.includes(cat)),
      ...used.filter(
        (cat) => !GALLERY_CATEGORIES.includes(cat as (typeof GALLERY_CATEGORIES)[number])
      ),
    ];
    return ["All", ...ordered];
  }, [items]);

  const activeCategory =
    selectedCategory === "All" || categories.includes(selectedCategory)
      ? selectedCategory
      : "All";

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  const useBentoFeature = filteredItems.length >= 4;

  return (
    <div className="bg-timber-beige min-h-screen pt-24 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        <ScrollReveal className="text-center mb-10">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">
            Built from the Log Up
          </h1>
          <p className="text-timber-muted max-w-2xl mx-auto">
            From raw log roofs to finished dining tables, every Timber project starts with the
            same thing: real wood, shaped by hand. Explore the spaces we&apos;ve built and furnished.
          </p>
        </ScrollReveal>

        {categories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map((category) => {
              const count =
                category === "All"
                  ? items.length
                  : items.filter((item) => item.category === category).length;
              const isSelected = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`interactive px-4 py-1.5 rounded-full text-xs tracking-wide transition ${
                    isSelected
                      ? "bg-timber-darkwood text-timber-beige font-medium"
                      : "border border-timber-darkwood/25 text-timber-darkwood hover:border-timber-darkwood"
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-[360px]">
            {[0, 1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="rounded-sm bg-timber-darkwood/10 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 px-6 border border-timber-darkwood/15 rounded-sm bg-white/50">
            <p className="text-timber-darkwood font-serif text-xl mb-2">
              Unable to load gallery showcase
            </p>
            <p className="text-sm text-timber-muted">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 px-6 border border-timber-darkwood/15 rounded-sm bg-white/40">
            <p className="text-timber-darkwood font-serif text-2xl mb-2">
              Curating New Showcase Pieces
            </p>
            <p className="text-sm text-timber-muted max-w-md mx-auto">
              Select photos in Gallery Management and click Show to display them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-[400px]">
            {filteredItems.map((project, index) => (
              <ScrollReveal
                key={project.id}
                delay={Math.min(index, 5) * 0.08}
                className={`group relative overflow-hidden rounded-sm bg-timber-darkwood ${
                  useBentoFeature && index === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  unoptimized={project.imageUrl.startsWith("data:")}
                  sizes={
                    useBentoFeature && index === 0
                      ? "(max-width: 1024px) 100vw, 66vw"
                      : "(max-width: 768px) 100vw, 33vw"
                  }
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300" />

                <div className="absolute bottom-0 left-0 p-8 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-timber-beige/85 text-xs tracking-widest uppercase mb-2 block">
                    {project.category}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-white">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p
                      className={`text-white/85 mt-3 max-w-md text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        useBentoFeature && index === 0 ? "md:text-base" : ""
                      }`}
                    >
                      {project.description}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

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
