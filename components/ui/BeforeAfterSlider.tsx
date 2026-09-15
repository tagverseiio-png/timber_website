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

      {/* Before Image (Foreground, masked) */}
      <div 
        className="absolute inset-0 right-0 overflow-hidden"
        style={{ 
          WebkitMaskImage: `linear-gradient(to right, black calc(${sliderPosition}% - 20px), transparent calc(${sliderPosition}% + 20px))`,
          maskImage: `linear-gradient(to right, black calc(${sliderPosition}% - 20px), transparent calc(${sliderPosition}% + 20px))`
        }}
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
        className="absolute top-0 bottom-0 w-1 bg-[#8b5a2b]/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 cursor-ew-resize interactive backdrop-blur-sm"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing border-4 border-[#5c4033] bg-[#d4a373] overflow-hidden group">
          {/* Concentric rings simulating wood cross-section */}
          <div className="absolute inset-1 rounded-full border-[1.5px] border-[#8b5a2b]/40 group-active:scale-95 transition-transform duration-300"></div>
          <div className="absolute inset-2.5 rounded-full border-[1px] border-[#8b5a2b]/30 group-active:scale-90 transition-transform duration-300"></div>
          <div className="absolute inset-4 rounded-full border-[1.5px] border-[#8b5a2b]/40 group-active:scale-75 transition-transform duration-300"></div>
          <ArrowLeftRight size={18} className="text-[#3e2723] relative z-10 opacity-80" />
        </div>
      </div>
    </div>
  );
}
