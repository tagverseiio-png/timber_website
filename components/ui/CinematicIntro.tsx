"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { introImages } from "@/lib/data/introImages";

// Helper hook to detect if it's a mobile device (rough estimation)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

export function CinematicIntro() {
  const [phase, setPhase] = useState<"logo" | "images" | "exit">("logo");
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [shouldRender, setShouldRender] = useState<boolean | null>(null); // null means checking
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenCinematicIntro");
    // const hasSeen = false; // uncomment for testing
    if (hasSeen) {
      setShouldRender(false);
      // Dispatch immediately in case other components are listening
      window.dispatchEvent(new Event("introComplete"));
    } else {
      setShouldRender(true);
      sessionStorage.setItem("hasSeenCinematicIntro", "true");
    }
  }, []);

  // Mouse tracking for parallax and custom cursor
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 30, stiffness: 100, mass: 1 });
  const smoothMouseY = useSpring(mouseY, { damping: 30, stiffness: 100, mass: 1 });

  // Custom Cursor Spring
  const cursorX = useSpring(mouseX, { damping: 25, stiffness: 200, mass: 0.5 });
  const cursorY = useSpring(mouseY, { damping: 25, stiffness: 200, mass: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates from -1 to 1 based on window center
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    // Phase Timeline
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (phase === "logo") {
      // Logo fades out after 1.5s
      timer1 = setTimeout(() => setPhase("images"), 1500);
    } else if (phase === "images") {
      // Images sit for 2.5s before auto exiting
      timer2 = setTimeout(() => setPhase("exit"), 2500);
    } else if (phase === "exit") {
      // Wait for exit animation to finish before notifying parent
      const timer3 = setTimeout(() => {
        window.dispatchEvent(new Event("introComplete"));
        setShouldRender(false);
      }, 1500);
      return () => clearTimeout(timer3);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [phase]);

  useEffect(() => {
    // Allow wheel/scroll or touchmove to immediately trigger the exit phase
    const handleScroll = (e: Event) => {
      if (phase === "images") {
        setPhase("exit");
      }
    };
    
    window.addEventListener("wheel", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [phase]);

  if (shouldRender === false) return null;
  // If still checking session storage (avoid hydration mismatch), render nothing or a loading state
  if (shouldRender === null) return (
    <div className="fixed inset-0 z-[200] bg-timber-beige" /> 
  );

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-timber-beige overflow-hidden pointer-events-auto"
      style={{
        // Disable pointer events when exiting so clicks fall through to the Hero
        pointerEvents: phase === "exit" ? "none" : "auto"
      }}
    >
      {/* Custom Cursor (Desktop only) */}
      {!isMobile && phase === "images" && (
        <motion.div
          className="fixed left-0 top-0 pointer-events-none z-[300] flex items-center justify-center mix-blend-difference"
          style={{ 
            x: useTransform(cursorX, [-1, 1], [0, typeof window !== "undefined" ? window.innerWidth : 0]),
            y: useTransform(cursorY, [-1, 1], [0, typeof window !== "undefined" ? window.innerHeight : 0]),
            translateX: "-50%",
            translateY: "-50%"
          }}
          animate={{
            scale: isHoveringImage ? 1 : 0,
            opacity: isHoveringImage ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-24 h-24 rounded-full border border-white/40 flex items-center justify-center text-white text-xs tracking-[0.2em] uppercase backdrop-blur-md bg-black/10">
            Explore
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {phase === "logo" && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute z-50 flex items-center justify-center"
          >
            <div className="relative w-64 md:w-96 aspect-[3/1]">
              <Image 
                src="/images/logo.png" 
                alt="Timber Logo" 
                fill 
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex items-center justify-center">
        {introImages.map((img, i) => {
          // Parse initial pos
          const initX = typeof img.initialPos.x === "string" ? parseFloat(img.initialPos.x) : img.initialPos.x;
          // Determine if it should exit left or right based on initial position
          const exitX = initX < 0 ? "-150vw" : "150vw";
          
          return (
            <motion.div
              key={img.id}
              initial={{ 
                opacity: 0, 
                x: img.initialPos.x, 
                y: img.initialPos.y, 
                scale: 0.8,
                rotate: 0 
              }}
              animate={phase === "images" ? { 
                opacity: 1, 
                scale: img.initialPos.scale,
                rotate: img.initialPos.rotate
              } : phase === "exit" ? {
                opacity: 0,
                x: exitX,
                scale: img.initialPos.scale * 1.5, // Scale up slightly as it moves out
                rotate: img.initialPos.rotate * 2
              } : {}}
              transition={{
                duration: phase === "exit" ? 1.5 : 1.2,
                ease: [0.25, 0.1, 0.25, 1], // cinematic smooth ease
                delay: phase === "images" ? i * 0.15 : 0 // stagger in, exit simultaneously
              }}
              style={{
                // Parallax Effect
                x: useTransform(smoothMouseX, [-1, 1], [`calc(${img.initialPos.x} + ${-20 * img.depth}px)`, `calc(${img.initialPos.x} + ${20 * img.depth}px)`]),
                y: useTransform(smoothMouseY, [-1, 1], [`calc(${img.initialPos.y} + ${-20 * img.depth}px)`, `calc(${img.initialPos.y} + ${20 * img.depth}px)`]),
                zIndex: Math.round(img.depth * 10)
              }}
              className="absolute shadow-2xl rounded-sm overflow-hidden"
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
            >
              <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 300px, 400px"
                  priority
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
