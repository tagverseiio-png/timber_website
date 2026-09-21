"use client";

import { useRef, useState, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TimberGrainEffectProps {
  children?: React.ReactNode;
  className?: string;
}

export function TimberGrainEffect({ children, className = "" }: TimberGrainEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates between -0.5 and 0.5
    mouseX.set(x / width - 0.5);
    mouseY.set(y / height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const lightingBackground = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(circle at ${(x as number + 0.5) * 100}% ${(y as number + 0.5) * 100}%, rgba(255,255,255,0.4) 0%, transparent 60%)`
  );

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden perspective-1000 ${className}`}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative"
      >
        {/* Subtle wood texture overlay */}
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-multiply pointer-events-none transition-opacity duration-500 hover:opacity-20 bg-[url('https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        
        {/* Lighting gradient that moves with mouse */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none opacity-30 mix-blend-overlay"
          style={{
            background: lightingBackground
          }}
        />

        <div className="relative z-20 w-full h-full transform-translate-z-10" style={{ transform: "translateZ(30px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
