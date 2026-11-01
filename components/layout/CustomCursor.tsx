"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCursorStore } from "@/store/useCursorStore";
import { useHydrated } from "@/lib/useHydrated";

// Pointer capability via a live media-query subscription — the React-blessed
// replacement for setState-in-effect mount detection (SSR snapshot: false).
const COARSE = "(pointer: coarse)";
function subscribePointer(callback: () => void) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function CustomCursor() {
  const { text, isHovering } = useCursorStore();
  const hydrated = useHydrated();
  const isTouchDevice = useSyncExternalStore(
    subscribePointer,
    () => window.matchMedia(COARSE).matches,
    () => false
  );
  const [isVisible, setIsVisible] = useState(false);

  // Motion values for smooth interpolation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (isTouchDevice) return; // touch devices keep the native cursor

    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true); // idempotent — React bails out when the value is unchanged
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", updateMousePosition);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    document.body.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isTouchDevice]);

  if (!hydrated || isTouchDevice || !isVisible) return null;

  const hasText = text.length > 0;
  const cursorSize = hasText ? 80 : (isHovering ? 48 : 16);

  return (
    <motion.div
      className="fixed top-0 left-0 rounded-full pointer-events-none z-[100] flex items-center justify-center text-center overflow-hidden mix-blend-difference"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: "-50%",
        translateY: "-50%",
        width: cursorSize,
        height: cursorSize,
        backgroundColor: hasText ? "#1a4341" : "transparent",
        border: hasText ? "none" : (isHovering ? "1px solid #1a4341" : "2px solid #1a4341"),
        color: "#f5f0e6"
      }}
      animate={{
        scale: hasText ? 1 : (isHovering ? 1.2 : 1),
      }}
      transition={{ type: "tween", ease: "circOut", duration: 0.2 }}
    >
      {hasText && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="text-[10px] font-bold tracking-widest uppercase block"
        >
          {text}
        </motion.span>
      )}
    </motion.div>
  );
}
