"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = "Raw Timber",
  afterAlt = "Finished Furniture",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging) return;
    if ("touches" in e) return; // ignore touch here
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", handleMouseMove as any);
      window.addEventListener("touchend", onMouseUp);
      window.addEventListener("touchmove", handleTouchMove as any);
    }
    
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("touchmove", handleTouchMove as any);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden select-none"
      ref={containerRef}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 80vw"
          priority
        />
        <div className="absolute top-6 right-6 bg-timber-darkwood/70 backdrop-blur-sm text-timber-beige px-4 py-2 rounded-full text-sm font-medium tracking-wide">
          Finished Piece
        </div>
      </div>

      {/* Before Image (Foreground, clipped) */}
      <div 
        className="absolute inset-0 right-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 80vw"
          priority
        />
        <div className="absolute top-6 left-6 bg-timber-beige/80 backdrop-blur-sm text-timber-darkwood px-4 py-2 rounded-full text-sm font-medium tracking-wide">
          Raw Timber
        </div>
      </div>

      {/* Slider Line & Button */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-timber-beige shadow-lg z-10 cursor-ew-resize interactive"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-timber-teal text-timber-beige rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing border-2 border-timber-beige">
          <ArrowLeftRight size={18} />
        </div>
      </div>
    </div>
  );
}
