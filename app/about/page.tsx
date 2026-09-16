"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="bg-timber-beige min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center -mt-24 pt-24 overflow-hidden group">
        <motion.div 
          className="absolute inset-0 w-full h-full"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <Image
              src="/images/about-first-image.jpeg"
              alt=""
              fill
              className="object-cover blur-2xl opacity-50 scale-110"
              priority
            />
          </motion.div>
          <motion.div
            className="w-full h-full relative z-10"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src="/images/about-first-image.jpeg"
              alt="Craftsmanship"
              fill
              className="object-contain brightness-[0.85] drop-shadow-2xl"
              priority
            />
          </motion.div>
        </motion.div>
        <div className="relative z-10 text-center pointer-events-none mt-10">
          <ScrollReveal>
            <h1 className="font-serif text-5xl md:text-7xl text-timber-darkwood bg-timber-beige/80 px-8 py-4 rounded-xl backdrop-blur-md mb-4 shadow-lg border border-timber-darkwood/10 inline-block">Our Story</h1>
            <br/>
            <p className="text-timber-darkwood font-medium text-lg uppercase tracking-widest bg-timber-beige/80 px-6 py-2 rounded-lg backdrop-blur-md inline-block shadow-sm border border-timber-darkwood/10 mt-2">Rooted in Nature</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 container mx-auto px-6 md:px-12">
        {/* Section 1: Origins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <ScrollReveal direction="right">
            <h2 className="font-serif text-4xl text-timber-darkwood mb-6">How It All Began</h2>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              Timber, House of Exclusive was founded in 2005 by Vijayalakshmi (Viji) Saravanan. During a trip to Indonesia to visit her sister, she was captivated by the high-quality, well-designed teak furniture available at reasonable prices.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              In a market flooded with MDF, rubberwood, and compressed wood, teakwood furniture stood out as a superior choice due to its antique appearance, near-lifetime durability, and customizable finishes.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed">
              Viji had a primary focus on Victorian, Rococo, Gothic, and Chippendale-inspired designs featuring elements such as fluted legs, canopy carvings, Queen Anne legs, and luxurious fabrics.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="left" className="relative aspect-square md:aspect-[4/3]">
            <Image
              src="/images/about1.jpeg"
              alt="Teakwood Craftsmanship"
              fill
              className="object-cover"
            />
          </ScrollReveal>
        </div>

        {/* Section 2: The Inspiration & Start */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <ScrollReveal direction="right" className="relative aspect-square md:aspect-[4/3] order-2 md:order-1">
            <Image
              src="/images/about2.jpeg"
              alt="Timber Showroom"
              fill
              className="object-cover"
            />
          </ScrollReveal>
          <ScrollReveal direction="left" className="order-1 md:order-2">
            <h2 className="font-serif text-4xl text-timber-darkwood mb-6">From a Home to a Showroom</h2>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              Inspired by her interest in interior design, she purchased a container of furniture for her home. After renovating her house, the compliments from friends and relatives poured in, sparking the idea to start a small business selling exclusive teak furniture.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              In 2005, she launched a furniture showroom, Timber, on the first floor of her house in Rutland Gate 4th Street, with financial support from her husband. Within a few months, Viji was delighted to see her furniture selling rapidly.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed">
              Customers were impressed by the cost and finish, as there was no other place in Chennai offering such quality. Without any advertisements, the positive feedback from satisfied customers spread by word of mouth.
            </p>
          </ScrollReveal>
        </div>

        {/* Section 3: Growth and Family */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal direction="right">
            <h2 className="font-serif text-4xl text-timber-darkwood mb-6">A Thriving Family Business</h2>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              As the business grew, she needed more investment and had to fully dedicate her time to Timber. She convinced her husband to help with logistics and diversified Timber into a comprehensive furniture showroom catering to all tastes.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed mb-4">
              Timber now customizes furniture based on customer requirements, provides after-sales service for damage or customization (even years later), offers design advice for homes, restaurants and offices, and helps customers secure the best deals on bedding, fabric, marble, and glass as well.
            </p>
            <p className="text-timber-darkwood/80 leading-relaxed font-medium">
              Today, it is a thriving family business with regular customers from all around India. Timber primarily sells teakwood furniture but also specializes in mahogany, solid wood, rattan and cane. Viji’s son, Abhinav, a practicing architect in Chennai manages the day-to-day operations.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="left" className="relative aspect-square md:aspect-[4/3]">
            <Image
              src="/images/anout3.jpeg"
              alt="Modern Timber Furniture"
              fill
              className="object-cover brightness-90"
            />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
