export interface IntroImage {
  id: number;
  src: string;
  alt: string;
  depth: number; // For parallax effect (e.g., 0.5 for background, 1.5 for foreground)
  initialPos: {
    x: string | number; // CSS translation values like "-20vw", "100px", etc.
    y: string | number;
    rotate: number; // initial rotation in degrees
    scale: number;
  };
}

export const introImages: IntroImage[] = [
  {
    id: 1,
    src: "/images/intro/wardrobe.png",
    alt: "Carved Wardrobe",
    depth: 0.6,
    initialPos: { x: "-25vw", y: "-15vh", rotate: -4, scale: 0.8 },
  },
  {
    id: 2,
    src: "/images/intro/chairs.jpg",
    alt: "Timber Chairs",
    depth: 0.8,
    initialPos: { x: "20vw", y: "-25vh", rotate: 6, scale: 0.9 },
  },
  {
    id: 3,
    src: "/images/intro/birds.png",
    alt: "Carved Wooden Birds",
    depth: 1.2,
    initialPos: { x: "-30vw", y: "20vh", rotate: 8, scale: 1.1 },
  },
  {
    id: 4,
    src: "/images/intro/shelf.png",
    alt: "Wooden Shelf",
    depth: 1.5,
    initialPos: { x: "25vw", y: "15vh", rotate: -5, scale: 1.0 },
  },
  {
    id: 5,
    src: "/images/intro/sofa.png",
    alt: "Green Leather Sofa Set",
    depth: 1.1,
    initialPos: { x: "0vw", y: "30vh", rotate: 2, scale: 1.2 },
  }
];
