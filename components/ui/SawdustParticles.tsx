"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
}

const PARTICLE_COUNT = 24;

export function SawdustParticles() {
  const shouldReduceMotion = useReducedMotion();

  // Precompute once: previously Math.random() ran on every render, which both
  // churned values each render and risked hydration mismatches.
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // start X (vw %)
        y: Math.random() * 100, // start Y (vh %)
        size: Math.random() * 3 + 1, // 1px to 4px
        opacity: 0.2 + Math.random() * 0.4,
        duration: Math.random() * 20 + 10, // 10s to 30s
        delay: Math.random() * 5, // 0s to 5s
        drift: (Math.random() - 0.5) * 500, // horizontal drift (%)
        rotate: Math.random() * 360,
      })),
    []
  );

  // No perpetual animation work for users who prefer reduced motion.
  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-timber-beige mix-blend-screen"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: ["0%", "-1000%"],
            x: ["0%", `${p.drift}%`],
            opacity: [0, 0.6, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
