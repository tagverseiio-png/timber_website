"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, Minus, Plus, ShoppingBag, Star, Info, Truck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useParams } from "next/navigation";

// Mock database fetch
const getProduct = (id: string) => {
  return {
    id: id,
    name: "The Artisan Dining Table",
    price: 2400,
    woodType: "Solid Walnut",
    description: "Handcrafted from single slabs of premium walnut, The Artisan Dining Table is the centerpiece your dining room deserves. Each table features unique grain patterns and live edges that tell the story of the tree it came from. Finished with natural oils to protect the wood while allowing it to breathe and age beautifully over time.",
    dimensions: "96\" L x 42\" W x 30\" H",
    material: "Sustainably sourced American Black Walnut",
    finish: "Natural Danish Oil, Matte Polyurethane Topcoat",
    availability: "In Stock - Ships in 2-3 weeks",
    rating: 5,
    reviews: 24,
    images: [
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=1500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=1500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?q=80&w=1500&auto=format&fit=crop",
    ]
  };
};

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string || "1";
  const product = getProduct(id);
  
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-timber-muted mb-8">
          <Link href="/" className="hover:text-timber-teal transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/shop" className="hover:text-timber-teal transition-colors">Shop</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-timber-darkwood">{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Gallery */}
          <div className="lg:w-3/5 flex flex-col gap-4">
            <ScrollReveal className="relative aspect-[4/3] md:aspect-square bg-timber-cream rounded-sm overflow-hidden interactive">
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </ScrollReveal>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setActiveImage(index)}
                  className={`relative w-24 h-24 flex-shrink-0 rounded-sm overflow-hidden ${activeImage === index ? 'ring-2 ring-timber-teal' : 'opacity-70 hover:opacity-100 transition-opacity'} interactive`}
                >
                  <Image src={img} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="lg:w-2/5 flex flex-col">
            <ScrollReveal delay={0.2} direction="left">
              <h1 className="font-serif text-4xl text-timber-darkwood mb-2">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6 text-sm">
                <div className="flex text-timber-teal">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < product.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-timber-muted">{product.reviews} Reviews</span>
              </div>

              <div className="text-3xl font-medium text-timber-darkwood mb-8">
                ${product.price.toFixed(2)}
              </div>

              <p className="text-timber-darkwood/80 mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Quantity & Actions */}
              <div className="flex flex-col gap-4 mb-12">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium uppercase tracking-wider text-timber-darkwood">Quantity</span>
                  <div className="flex items-center border border-timber-darkwood/20">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-timber-darkwood/5 transition-colors interactive"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-timber-darkwood/5 transition-colors interactive"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-timber-teal text-white py-4 font-medium tracking-wider uppercase text-sm hover:bg-timber-darkwood transition-colors flex items-center justify-center gap-2 interactive">
                    <ShoppingBag size={18} />
                    Add to Cart
                  </button>
                  <button className="w-14 h-14 border border-timber-darkwood/20 flex items-center justify-center text-timber-darkwood hover:bg-white hover:text-red-500 hover:border-red-500 transition-colors interactive">
                    <Heart size={20} />
                  </button>
                </div>
              </div>

              {/* Accordion Specs */}
              <div className="border-t border-timber-darkwood/10 pt-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-timber-darkwood font-medium">
                    <Info size={18} />
                    <span>Specifications</span>
                  </div>
                  <ul className="text-sm text-timber-darkwood/70 space-y-2 ml-6 mt-2">
                    <li><strong className="text-timber-darkwood">Wood Type:</strong> {product.woodType}</li>
                    <li><strong className="text-timber-darkwood">Dimensions:</strong> {product.dimensions}</li>
                    <li><strong className="text-timber-darkwood">Material:</strong> {product.material}</li>
                    <li><strong className="text-timber-darkwood">Finish:</strong> {product.finish}</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-timber-darkwood font-medium">
                    <Truck size={18} />
                    <span>Delivery & Returns</span>
                  </div>
                  <p className="text-sm text-timber-darkwood/70 ml-6 mt-2">
                    {product.availability}. White glove delivery available for an additional fee. 
                    30-day return policy on standard items.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
