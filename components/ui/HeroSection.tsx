"use client";

import { useRef, MouseEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion, AnimatePresence, Variants } from "framer-motion";
import { useCursorStore } from "@/store/useCursorStore";
import { ArrowRight } from "lucide-react";
import { SawdustParticles } from "./SawdustParticles";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { setCursorState, resetCursor } = useCursorStore();
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenCinematicIntro");
    
    if (hasSeenIntro) {
      // Trigger reveal sequence after a short delay normally
      const timer = setTimeout(() => setIsRevealed(true), 500);
      return () => clearTimeout(timer);
    } else {
      // Wait for CinematicIntro to finish
      const handleIntro = () => setIsRevealed(true);
      window.addEventListener("introComplete", handleIntro);
      return () => window.removeEventListener("introComplete", handleIntro);
    }
  }, []);

  // Scroll Parallax
  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scrollYTransform = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const imageScrollY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const logsFrontScrollY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const logsBackScrollY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scrollCueOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  // Mouse Parallax & Lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100, mass: 1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Parallax mappings
  const imageX = useTransform(smoothMouseX, [-0.5, 0.5], [10, -10]);
  const imageY = useTransform(smoothMouseY, [-0.5, 0.5], [10, -10]);
  const textX = useTransform(smoothMouseX, [-0.5, 0.5], [-5, 5]);
  const textY = useTransform(smoothMouseY, [-0.5, 0.5], [-5, 5]);
  const grainX = useTransform(smoothMouseX, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e: MouseEvent) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Stagger variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.8 },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const fadeVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: "easeOut" },
    },
  };

  // Image reveal using clipPath
  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 1.08, clipPath: "inset(10% 10% 10% 10%)" },
    visible: {
      opacity: 1,
      scale: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      transition: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial="hidden"
      animate="visible"
      style={{ opacity: opacityTransform }}
      className="relative w-full h-[90vh] md:h-screen flex items-center justify-center pt-20 -mt-24 overflow-hidden bg-timber-darkwood"
    >
      {/* Wood Grain Double Door Reveal */}
      <AnimatePresence>
        {!isRevealed && (
          <div className="absolute inset-0 z-50 flex pointer-events-none">
            <motion.div
              initial={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="w-1/2 h-full bg-timber-darkwood bg-[url('https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1000&auto=format&fit=crop')] bg-cover border-r-2 border-black/30 shadow-2xl"
            />
            <motion.div
              initial={{ x: "0%" }}
              exit={{ x: "100%" }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="w-1/2 h-full bg-timber-darkwood bg-[url('https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1000&auto=format&fit=crop')] bg-cover border-l-2 border-black/30 shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>

      <SawdustParticles />

      {/* Background Image & Mouse Parallax */}
      <motion.div
        variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : imageVariants}
        style={{
          x: shouldReduceMotion ? 0 : imageX,
          y: shouldReduceMotion ? imageScrollY : useTransform(() => imageScrollY.get() + imageY.get()),
        }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/images/hero-bg.jpg.png"
          alt="Premium Timber Furniture"
          fill
          priority
          className="object-cover brightness-[0.65]"
          onMouseEnter={() => setCursorState("EXPLORE", false)}
          onMouseLeave={resetCursor}
        />

        {/* Parallax Logs (Back) */}
        <motion.div
          style={{ y: logsBackScrollY, x: grainX }}
          className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-[url('https://images.unsplash.com/photo-1516962280632-4759600d8d0c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-bottom"
        />

        {/* Parallax Logs (Front) */}
        <motion.div
          style={{ y: logsFrontScrollY, x: textX }}
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none bg-[url('https://images.unsplash.com/photo-1582229555627-c10ce76cc638?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-bottom"
        />

        {/* Subtle Decorative Grain/Line */}
        <motion.div
          style={{ x: shouldReduceMotion ? 0 : grainX }}
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
        />

        {/* Interactive Lighting */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
            style={{
              background: useTransform(
                [smoothMouseX, smoothMouseY],
                ([x, y]) =>
                  `radial-gradient(circle at ${(x as number + 0.5) * 100}% ${(y as number + 0.5) * 100}%, rgba(245, 240, 230, 0.3) 0%, transparent 50%)`
              ),
            }}
          />
        )}
      </motion.div>

      {/* Content Container */}
      <motion.div
        variants={containerVariants}
        style={{
          y: scrollYTransform,
          x: shouldReduceMotion ? 0 : textX,
        }}
        className="container mx-auto px-6 relative z-10 flex flex-col items-start lg:items-center lg:text-center mt-10 md:mt-0"
      >
        <motion.p
          variants={fadeVariants}
          className="text-timber-beige/80 uppercase tracking-[0.2em] text-xs md:text-sm font-semibold mb-6"
        >
          Premium Timber Furniture
        </motion.p>

        <motion.div variants={textContainerVariants} className="overflow-hidden mb-2 flex gap-4 flex-wrap justify-center lg:justify-start">
          {["Crafted", "by", "Nature."].map((word, i) => (
            <motion.h1
              key={i}
              variants={wordVariants}
              className={`font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-timber-beige tracking-tight leading-[1.1] ${i === 2 ? 'italic' : ''}`}
            >
              {word}
            </motion.h1>
          ))}
        </motion.div>
        <motion.div variants={textContainerVariants} className="overflow-hidden mb-8 flex gap-4 flex-wrap justify-center lg:justify-start">
          {["Designed", "for", "Life."].map((word, i) => (
            <motion.h1
              key={i}
              variants={wordVariants}
              className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-timber-beige tracking-tight leading-[1.1]"
            >
              {word}
            </motion.h1>
          ))}
        </motion.div>

        <motion.p
          variants={fadeVariants}
          className="text-lg md:text-xl text-timber-beige/90 max-w-2xl lg:mx-auto mb-12 font-light tracking-wide leading-relaxed"
        >
          Timeless furniture crafted from natural timber, bringing warmth, character, and lasting beauty into modern spaces.
        </motion.p>

        <motion.div variants={fadeVariants} className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
          <Link
            href="/shop"
            onMouseEnter={() => setCursorState("SHOP", true)}
            onMouseLeave={resetCursor}
            className="group relative overflow-hidden px-8 py-4 bg-timber-beige text-timber-darkwood font-medium tracking-wider uppercase text-sm transition-colors interactive flex items-center justify-center gap-3"
          >
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
              Explore Collection
            </span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
            <div className="absolute inset-0 bg-timber-teal transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out" />
          </Link>

          <Link
            href="/about"
            onMouseEnter={() => setCursorState("DISCOVER", false)}
            onMouseLeave={resetCursor}
            className="group px-8 py-4 bg-transparent border border-timber-beige text-timber-beige font-medium tracking-wider uppercase text-sm hover:bg-timber-beige/10 transition-colors interactive flex items-center justify-center gap-3"
          >
            <span>Discover Our Craft</span>
            <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity: scrollCueOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
      >
        <motion.span variants={fadeVariants} className="text-[10px] tracking-[0.2em] text-timber-beige/70 uppercase">Scroll to Explore</motion.span>
        <div className="w-[1px] h-16 bg-timber-beige/30 relative flex justify-center">
          <motion.div
            animate={{
              y: ["0%", "200%", "0%"],
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 w-3 h-3 rounded-full border-2 border-timber-beige bg-timber-darkwood shadow-[0_0_10px_rgba(245,240,230,0.5)] -translate-x-1/2"
          >
            {/* Inner wood ring dot */}
            <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-timber-beige opacity-80" />
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}
