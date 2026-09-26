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

function ParallaxImage({ img, i, phase, smoothMouseX, smoothMouseY, setIsHoveringImage }: any) {
  const initX = typeof img.initialPos.x === "string" ? parseFloat(img.initialPos.x) : img.initialPos.x;
  const exitX = initX < 0 ? "-150vw" : "150vw";
  
  const x = useTransform(smoothMouseX, [-1, 1], [`calc(${img.initialPos.x} + ${-20 * img.depth}px)`, `calc(${img.initialPos.x} + ${20 * img.depth}px)`]);
  const y = useTransform(smoothMouseY, [-1, 1], [`calc(${img.initialPos.y} + ${-20 * img.depth}px)`, `calc(${img.initialPos.y} + ${20 * img.depth}px)`]);

  return (
    <motion.div
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
        scale: img.initialPos.scale * 1.5,
        rotate: img.initialPos.rotate * 2
      } : {}}
      transition={{
        duration: phase === "exit" ? 1.5 : 1.2,
        ease: [0.25, 0.1, 0.25, 1],
        delay: phase === "images" ? i * 0.15 : 0
      }}
      style={{
        x,
        y,
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
}

export function CinematicIntro() {
  const [phase, setPhase] = useState<"logo" | "images" | "exit">("logo");
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [shouldRender, setShouldRender] = useState<boolean | null>(null); // null means checking
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenCinematicIntro");
    if (hasSeen) {
      setShouldRender(false);
      window.dispatchEvent(new Event("introComplete"));
    } else {
      setShouldRender(true);
      sessionStorage.setItem("hasSeenCinematicIntro", "true");
    }
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 30, stiffness: 100, mass: 1 });
  const smoothMouseY = useSpring(mouseY, { damping: 30, stiffness: 100, mass: 1 });

  const cursorX = useSpring(mouseX, { damping: 25, stiffness: 200, mass: 0.5 });
  const cursorY = useSpring(mouseY, { damping: 25, stiffness: 200, mass: 0.5 });

  const cursorStyleX = useTransform(cursorX, [-1, 1], [0, typeof window !== "undefined" ? window.innerWidth : 0]);
  const cursorStyleY = useTransform(cursorY, [-1, 1], [0, typeof window !== "undefined" ? window.innerHeight : 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (phase === "logo") {
      timer1 = setTimeout(() => setPhase("images"), 1500);
    } else if (phase === "images") {
      timer2 = setTimeout(() => setPhase("exit"), 2500);
    } else if (phase === "exit") {
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
        pointerEvents: phase === "exit" ? "none" : "auto"
      }}
    >
      {!isMobile && phase === "images" && (
        <motion.div
          className="fixed left-0 top-0 pointer-events-none z-[300] flex items-center justify-center mix-blend-difference"
          style={{ 
            x: cursorStyleX,
            y: cursorStyleY,
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
                src="/images/logo-transparent.png" 
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
        {introImages.map((img, i) => (
          <ParallaxImage 
            key={img.id} 
            img={img} 
            i={i} 
            phase={phase} 
            smoothMouseX={smoothMouseX} 
            smoothMouseY={smoothMouseY} 
            setIsHoveringImage={setIsHoveringImage} 
          />
        ))}
      </div>
    </motion.div>
  );
}
