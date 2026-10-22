"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deterministic pseudo-random generation to avoid Math.random() SSR/client drift
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const r1 = Math.abs(Math.sin(i * 12.9898 + 78.233)) % 1;
        const r2 = Math.abs(Math.sin(i * 43.1234 + 19.827)) % 1;
        const r3 = Math.abs(Math.sin(i * 92.7182 + 54.321)) % 1;
        const r4 = Math.abs(Math.sin(i * 17.4321 + 65.432)) % 1;
        const r5 = Math.abs(Math.sin(i * 61.9876 + 32.109)) % 1;
        const r6 = Math.abs(Math.sin(i * 88.5432 + 11.234)) % 1;
        const r7 = Math.abs(Math.sin(i * 35.6789 + 99.876)) % 1;
        const r8 = Math.abs(Math.sin(i * 73.2468 + 44.556)) % 1;

        return {
          id: i,
          x: r1 * 100, // start X (vw %)
          y: r2 * 100, // start Y (vh %)
          size: r3 * 3 + 1, // 1px to 4px
          opacity: 0.2 + r4 * 0.4,
          duration: r5 * 20 + 10, // 10s to 30s
          delay: r6 * 5, // 0s to 5s
          drift: (r7 - 0.5) * 500, // horizontal drift (%)
          rotate: r8 * 360,
        };
      }),
    []
  );

  // Prevent SSR hydration mismatch and respect prefers-reduced-motion
  if (!mounted || shouldReduceMotion) return null;

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
