"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function TimberStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Background Opacities
  // Stage 1: 0 to 0.33 (Forest)
  const bg1Opacity = useTransform(scrollYProgress, [0, 0.25, 0.33], [1, 1, 0]);
  
  // Stage 2: 0.33 to 0.66 (Log/Carving)
  const bg2Opacity = useTransform(scrollYProgress, [0.25, 0.33, 0.58, 0.66], [0, 1, 1, 0]);
  
  // Stage 3: 0.66 to 1.0 (Finished Furniture)
  const bg3Opacity = useTransform(scrollYProgress, [0.58, 0.66, 1], [0, 1, 1]);

  // Text Opacities & Transforms
  const text1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.25, 0.33], [0, 1, 1, 0]);
  const text1Y = useTransform(scrollYProgress, [0, 0.15, 0.33], [50, 0, -50]);

  const text2Opacity = useTransform(scrollYProgress, [0.25, 0.4, 0.5, 0.58], [0, 1, 1, 0]);
  const text2Y = useTransform(scrollYProgress, [0.25, 0.4, 0.58], [50, 0, -50]);

  const text3Opacity = useTransform(scrollYProgress, [0.58, 0.7, 0.9, 1], [0, 1, 1, 0.5]);
  const text3Y = useTransform(scrollYProgress, [0.58, 0.7, 1], [50, 0, -20]);

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-timber-darkwood">
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Background 1: Forest */}
        <motion.div 
          style={{ opacity: shouldReduceMotion ? 1 : bg1Opacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000&auto=format&fit=crop"
            alt="Deep Forest"
            fill
            className="object-cover brightness-50"
            priority
          />
        </motion.div>

        {/* Background 2: Carving/Log */}
        <motion.div 
          style={{ opacity: shouldReduceMotion ? 0 : bg2Opacity }}
          className="absolute inset-0 z-10"
        >
          <Image
            src="/images/art_of_craft.png"
            alt="Carving wood"
            fill
            className="object-cover brightness-50"
          />
        </motion.div>

        {/* Background 3: Finished Furniture */}
        <motion.div 
          style={{ opacity: shouldReduceMotion ? 0 : bg3Opacity }}
          className="absolute inset-0 z-20"
        >
          <Image
            src="/images/refine%20forlife.JPG"
            alt="Finished Furniture"
            fill
            className="object-cover brightness-[0.4]"
          />
        </motion.div>

        {/* Progress Line */}
        <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 w-[2px] h-1/3 bg-timber-beige/20 z-40 hidden md:block">
          <motion.div 
            style={{ height: progressHeight }} 
            className="w-full bg-timber-teal origin-top"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-30 w-full max-w-4xl mx-auto px-6 text-center text-timber-beige">
          {/* Text 1 */}
          <motion.div
            style={{ 
              opacity: shouldReduceMotion ? 1 : text1Opacity, 
              y: shouldReduceMotion ? 0 : text1Y,
              pointerEvents: "none"
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <h2 className="text-sm tracking-[0.2em] uppercase font-semibold text-timber-beige/70 mb-4">Phase 01</h2>
            <h3 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight">
              Roots in Nature
            </h3>
            <p className="text-lg md:text-xl text-timber-beige/80 max-w-2xl font-light leading-relaxed">
              Our journey begins deep in sustainably managed forests. We honor the origin of every piece, selecting only the finest, naturally fallen or responsibly harvested timber.
            </p>
          </motion.div>

          {/* Text 2 */}
          <motion.div
            style={{ 
              opacity: shouldReduceMotion ? 0 : text2Opacity, 
              y: shouldReduceMotion ? 0 : text2Y,
              pointerEvents: "none"
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <h2 className="text-sm tracking-[0.2em] uppercase font-semibold text-timber-beige/70 mb-4">Phase 02</h2>
            <h3 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight">
              The Art of Craft
            </h3>
            <p className="text-lg md:text-xl text-timber-beige/80 max-w-2xl font-light leading-relaxed">
              In the hands of master artisans, raw potential takes shape. Through time-honored woodworking techniques, we reveal the hidden character and unique grain of the wood.
            </p>
          </motion.div>

          {/* Text 3 */}
          <motion.div
            style={{ 
              opacity: shouldReduceMotion ? 0 : text3Opacity, 
              y: shouldReduceMotion ? 0 : text3Y,
              pointerEvents: "none"
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <h2 className="text-sm tracking-[0.2em] uppercase font-semibold text-timber-beige/70 mb-4">Phase 03</h2>
            <h3 className="font-serif text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight">
              Refined for Life
            </h3>
            <p className="text-lg md:text-xl text-timber-beige/80 max-w-2xl font-light leading-relaxed">
              The result is more than furniture; it is a legacy. A timeless centerpiece designed to bring warmth, luxury, and the essence of the forest into your living space.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
