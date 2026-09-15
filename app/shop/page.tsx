"use client";

import { useState } from "react";
import { ProductCard, Product } from "@/components/ui/ProductCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Filter, ChevronDown } from "lucide-react";

// Mock data
const ALL_PRODUCTS: Product[] = [
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
    rating: 4.9,
    category: "beds"
  },
  {
    id: "4",
    name: "Classic Bookshelf",
    price: 1200,
    woodType: "Mahogany",
    image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=1000&auto=format&fit=crop",
    rating: 4.7,
    category: "cabinets"
  },
  {
    id: "5",
    name: "Modern Stool",
    price: 250,
    woodType: "Maple",
    image: "https://images.unsplash.com/photo-1503602642458-143ff80897ff?q=80&w=1000&auto=format&fit=crop",
    rating: 4.5,
    category: "chairs"
  },
  {
    id: "6",
    name: "Executive Desk",
    price: 3200,
    woodType: "Teak",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1000&auto=format&fit=crop",
    rating: 5.0,
    category: "tables"
  }
];

const CATEGORIES = ["All", "Tables", "Chairs", "Beds", "Cabinets"];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  const filteredProducts = ALL_PRODUCTS.filter((product) => {
    if (activeCategory === "All") return true;
    return product.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // Sort logic (simplified)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0; // featured
  });

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <ScrollReveal className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">The Collection</h1>
          <p className="text-timber-muted max-w-2xl">
            Discover our entire range of premium handcrafted timber furniture. 
            Each piece is designed to bring warmth and elegance to your space.
          </p>
        </ScrollReveal>

        {/* Filters and Sorting */}
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-timber-darkwood/10 pb-6" delay={0.2}>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2 md:gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm tracking-wider transition-colors interactive ${
                  activeCategory === category 
                    ? "bg-timber-teal text-white" 
                    : "bg-transparent text-timber-darkwood border border-timber-darkwood/20 hover:border-timber-darkwood"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 text-sm text-timber-darkwood">
            <button className="flex items-center gap-2 hover:text-timber-teal transition-colors interactive">
              <Filter size={16} />
              <span>Filters</span>
            </button>
            
            <div className="relative group interactive cursor-pointer">
              <div className="flex items-center gap-2 hover:text-timber-teal transition-colors">
                <span>Sort By: {sortBy === 'featured' ? 'Featured' : sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}</span>
                <ChevronDown size={16} />
              </div>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 flex flex-col py-2">
                <button onClick={() => setSortBy("featured")} className="text-left px-4 py-2 hover:bg-timber-beige transition-colors">Featured</button>
                <button onClick={() => setSortBy("price-low")} className="text-left px-4 py-2 hover:bg-timber-beige transition-colors">Price: Low to High</button>
                <button onClick={() => setSortBy("price-high")} className="text-left px-4 py-2 hover:bg-timber-beige transition-colors">Price: High to Low</button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {sortedProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={0.1 * (index % 3)} direction="up">
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-timber-muted text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
