"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export function WoodShavingCursor() {
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      setIsVisible(true);
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 400);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      clearTimeout(timeout);
    };
  }, [cursorX, cursorY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 0.8, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-[100] text-[#d4a373] drop-shadow-md origin-center"
          style={{ 
            x: smoothX, 
            y: smoothY,
            // Offset so it trails slightly below and right of the actual cursor
            translateX: 12,
            translateY: 12,
          }}
        >
          {/* Wood Shaving SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 4C5.5 7.5 6.5 15.5 13 18C17.5 19.5 21 14 18 11C15 8 10 9 9 13C8.5 15 11 17.5 14 16" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
