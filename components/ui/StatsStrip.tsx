"use client";

import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

function Counter({ from = 0, to, duration = 2, suffix = "" }: { from?: number; to: number; duration?: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      const controls = animate(from, to, {
        duration,
        ease: [0.22, 1, 0.36, 1], // Organic easing
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = Math.round(value).toLocaleString() + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, inView, duration, suffix]);

  return <span ref={nodeRef} className="font-serif text-5xl md:text-6xl text-timber-teal mb-2">{from}{suffix}</span>;
}

export function StatsStrip() {
  return (
    <section className="py-20 px-6 md:px-12 bg-timber-cream border-y border-timber-darkwood/10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-timber-darkwood/10">
        <div className="flex flex-col items-center justify-center pt-8 md:pt-0">
          <Counter to={20} suffix="+" duration={2.5} />
          <span className="text-sm uppercase tracking-[0.15em] text-timber-darkwood/70 font-medium mt-2">Years of Mastery</span>
        </div>
        <div className="flex flex-col items-center justify-center pt-8 md:pt-0">
          <Counter to={5000} suffix="+" duration={3} />
          <span className="text-sm uppercase tracking-[0.15em] text-timber-darkwood/70 font-medium mt-2">Pieces Crafted</span>
        </div>
        <div className="flex flex-col items-center justify-center pt-8 md:pt-0">
          <Counter to={100} suffix="%" duration={2} />
          <span className="text-sm uppercase tracking-[0.15em] text-timber-darkwood/70 font-medium mt-2">Sustainably Sourced</span>
        </div>
      </div>
    </section>
  );
}
