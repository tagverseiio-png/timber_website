import { BOUTIQUE_PRODUCTS } from "@/lib/products/boutique_seed";

export interface WebsiteGallerySeed {
  /** Deterministic Firestore doc ID so re-pushing updates rather than duplicates. */
  id: string;
  title: string;
  description: string;
  category: string;
  imagePath: string;
  source: "gallery" | "website" | "boutique";
  orderIndex: number;
  /** Initial public gallery visibility when pushed to Firestore. */
  defaultActive: boolean;
}

/**
 * The 5 featured showcase items displayed initially on the public Gallery page (`/projects`).
 */
export const GALLERY_PAGE_SEEDS: WebsiteGallerySeed[] = [
  {
    id: "gallery-grand-sofa-collection",
    title: "Grand Heritage Carved 3-Seater Sofa",
    description:
      "Bespoke solid teakwood lounge centerpiece crafted with deep sculptural carving and tailored upholstery.",
    category: "Sofas",
    imagePath: "/images/sofa.JPG",
    source: "gallery",
    orderIndex: 1,
    defaultActive: true,
  },
  {
    id: "gallery-coastal-retreat-bed",
    title: "Coastal Retreat 4-Poster Timber Cot",
    description:
      "Hand-rubbed four-poster timber cot designed for airy bedrooms and heirloom comfort.",
    category: "Cots",
    imagePath: "/images/cots.jpg",
    source: "gallery",
    orderIndex: 2,
    defaultActive: true,
  },
  {
    id: "gallery-executive-bar",
    title: "Executive Teak Home Bar Unit",
    description:
      "Custom fluted teakwood bar cabinet and bottle credenza for home entertaining.",
    category: "Bar Units",
    imagePath: "/images/bar_unit.jpg",
    source: "gallery",
    orderIndex: 3,
    defaultActive: true,
  },
  {
    id: "gallery-modern-2-seater",
    title: "Modern Teak 2-Seater Loveseat",
    description:
      "Sculpted solid timber two-seater sofa with graceful curved armrests and lasting support.",
    category: "2 Seaters",
    imagePath: "/images/2 seater.jpg",
    source: "gallery",
    orderIndex: 4,
    defaultActive: true,
  },
  {
    id: "gallery-urban-oasis-terrace",
    title: "Urban Oasis Teak Outdoor Lounge",
    description:
      "Weather-treated Burma teak seating suite crafted for shaded verandahs and garden terraces.",
    category: "Outdoor",
    imagePath: "/images/outdoor.jpg",
    source: "gallery",
    orderIndex: 5,
    defaultActive: true,
  },
];

/**
 * Category, About, Hero, and Studio images across the Timber website.
 * Stored as Hidden initially so admins can toggle any selection Live from Gallery Management.
 */
export const WEBSITE_IMAGE_SEEDS: WebsiteGallerySeed[] = [
  {
    id: "website-artisan-chair",
    title: "Emerald Leather Wingback Chair",
    description:
      "Hand-carved teak cabriole frame upholstered in button-tufted emerald leather with brass studs.",
    category: "Chairs",
    imagePath: "/images/chair.jpg",
    source: "website",
    orderIndex: 6,
    defaultActive: false,
  },
  {
    id: "website-heritage-wingback",
    title: "Sunlit Heritage Emerald Wingback Chair",
    description:
      "Scrolled solid timber arms and deep emerald button-tufted leather in a tall heritage silhouette.",
    category: "Chairs",
    imagePath: "/images/Sunlit Heritage Wingback Chair.png",
    source: "website",
    orderIndex: 7,
    defaultActive: false,
  },
  {
    id: "website-hand-finished-grain",
    title: "Emerald Studded Spindle Tub Chair",
    description:
      "Low-back curved spindle crest rail paired with turned teak legs and brass-studded emerald upholstery.",
    category: "Chairs",
    imagePath: "/images/media_1789478474046.png",
    source: "website",
    orderIndex: 8,
    defaultActive: false,
  },
  {
    id: "website-3-seater-sofa",
    title: "3-Seater Heritage Teakwood Sofa",
    description:
      "Generously proportioned solid timber three-seater sofa anchored by hand-carved floral rails.",
    category: "3 Seaters",
    imagePath: "/images/3 seater.jpg",
    source: "website",
    orderIndex: 9,
    defaultActive: false,
  },
  {
    id: "website-white-sofa",
    title: "Ivory Button-Tufted 2-Seater Sofa",
    description:
      "Carved mahogany-finish settee upholstered in champagne ivory tufted fabric for luminous salons.",
    category: "2 Seaters",
    imagePath: "/images/white_sofa.png",
    source: "website",
    orderIndex: 10,
    defaultActive: false,
  },
  {
    id: "website-hero-bg",
    title: "Emerald Wingback & 2-Seater Salon Set",
    description:
      "Coordinated three-piece living suite pairing a carved emerald settee with matching wingback chairs.",
    category: "Sofas",
    imagePath: "/images/heropage bg.png",
    source: "website",
    orderIndex: 11,
    defaultActive: false,
  },
  {
    id: "website-refined-for-life",
    title: "Carved Velvet 5-Seater Salon Ensemble",
    description:
      "Heirloom five-piece living room suite with floral relief carvings and matching center coffee table.",
    category: "Sofas",
    imagePath: "/images/refine forlife.JPG",
    source: "website",
    orderIndex: 12,
    defaultActive: false,
  },
  {
    id: "website-classic-diwan",
    title: "Classic Carved Teakwood Diwan",
    description:
      "Hand-carved teak daybed and lounge diwan built for living rooms, studies, and verandahs.",
    category: "Diwans",
    imagePath: "/images/diwans.jpg",
    source: "website",
    orderIndex: 13,
    defaultActive: false,
  },
  {
    id: "website-dining-table",
    title: "Solid Teakwood Dining Table",
    description:
      "Seasoned teakwood dining table engineered for everyday warmth and family gatherings.",
    category: "Dining & Tables",
    imagePath: "/images/table.jpg",
    source: "website",
    orderIndex: 14,
    defaultActive: false,
  },
  {
    id: "website-emerald-dining-set",
    title: "Classic Emerald Leather 6-Seater Dining Set",
    description:
      "Carved ball-and-claw timber dining table matched with six brass-studded emerald leather chairs.",
    category: "Dining & Tables",
    imagePath: "/images/Classic Emerald Leather Dining Set.png",
    source: "website",
    orderIndex: 15,
    defaultActive: false,
  },
  {
    id: "website-about-hero",
    title: "6-Seater Emerald Leather Dining Suite",
    description:
      "Bespoke six-chair carved oval-back leather dining set crafted in seasoned Burma teak.",
    category: "Dining & Tables",
    imagePath: "/images/about-first-image.jpeg",
    source: "website",
    orderIndex: 16,
    defaultActive: false,
  },
  {
    id: "website-right-interior",
    title: "Carved Mahogany & Glass 4-Seater Dining Set",
    description:
      "Glass-top sculpted teak dining table paired with four slatted leather-seat chairs.",
    category: "Dining & Tables",
    imagePath: "/images/right_side_image.jpg",
    source: "website",
    orderIndex: 17,
    defaultActive: false,
  },
  {
    id: "website-misc-accents",
    title: "Circular Stained-Glass Timber Side Table",
    description:
      "Curved cabriole-leg accent cabinet with beaded trim and textured stained-glass doors.",
    category: "Dining & Tables",
    imagePath: "/images/misc.JPG",
    source: "website",
    orderIndex: 18,
    defaultActive: false,
  },
  {
    id: "website-mahogany-vanity",
    title: "Sunlit Antique Mahogany Vanity Ensemble",
    description:
      "Traditional carved mahogany dressing vanity with tilted oval mirror, drawers, and cushioned stool.",
    category: "Desks & Vanity",
    imagePath: "/images/Sunlit Antique Mahogany Vanity Ensemble.png",
    source: "website",
    orderIndex: 19,
    defaultActive: false,
  },
  {
    id: "website-about-craft",
    title: "Marble-Top Writing Desk & Spindle Tub Chair",
    description:
      "Three-drawer cabriole study desk crowned in honed beige marble alongside a carved emerald chair.",
    category: "Desks & Vanity",
    imagePath: "/images/about1.jpeg",
    source: "website",
    orderIndex: 20,
    defaultActive: false,
  },
  {
    id: "website-about-showroom",
    title: "Carved Oval-Mirror Vanity Table & Stool",
    description:
      "Hand-carved teak dressing table featuring five storage drawers, beveled oval mirror, and upholstered stool.",
    category: "Desks & Vanity",
    imagePath: "/images/about2.jpeg",
    source: "website",
    orderIndex: 21,
    defaultActive: false,
  },
  {
    id: "website-about-modern",
    title: "4-Door Carved Heritage Arched Wardrobe",
    description:
      "Full-height four-door solid timber almirah with intricate floral relief panels and cornice moulding.",
    category: "Wardrobes",
    imagePath: "/images/anout3.jpeg",
    source: "website",
    orderIndex: 22,
    defaultActive: false,
  },
  {
    id: "website-solid-teak-bookshelf",
    title: "Solid Teak Open Bookshelf",
    description:
      "Architectural solid teak shelving unit built for libraries, art books, and curated display pieces.",
    category: "Book Shelves",
    imagePath: "/images/bookshelf.jpg",
    source: "website",
    orderIndex: 23,
    defaultActive: false,
  },
  {
    id: "website-timber-buffet",
    title: "Handcrafted Teakwood Buffet Sideboard",
    description:
      "Precision-joined dining sideboard with carved drawer fronts and deep tableware storage.",
    category: "Buffets",
    imagePath: "/images/buffet.jpg",
    source: "website",
    orderIndex: 24,
    defaultActive: false,
  },
  {
    id: "website-chest-box",
    title: "Carved Blanket Chest Box",
    description:
      "Artisan heirloom trunk reinforced with brass fittings for linens, keepsakes, and bedroom storage.",
    category: "Chest Boxes",
    imagePath: "/images/chest_box.jpg",
    source: "website",
    orderIndex: 25,
    defaultActive: false,
  },
  {
    id: "website-chest-of-drawers",
    title: "Solid Wood Chest of Drawers",
    description:
      "Dovetail-joined chest of drawers finished by hand to reveal natural Burma teak figure.",
    category: "Chest of Draws",
    imagePath: "/images/chest_of_draws.jpg",
    source: "website",
    orderIndex: 26,
    defaultActive: false,
  },
  {
    id: "website-puja-unit",
    title: "Traditional Carved Teak Puja Mandir",
    description:
      "Custom sacred mandir unit featuring temple arches, bell lattices, and drawer storage.",
    category: "Puja Units",
    imagePath: "/images/puja_unit.jpg",
    source: "website",
    orderIndex: 27,
    defaultActive: false,
  },
  {
    id: "website-shoe-rack",
    title: "Slatted Teakwood Shoe Rack",
    description:
      "Ventilated entryway shoe cabinet crafted with louvered solid timber doors.",
    category: "Shoe Racks",
    imagePath: "/images/shoe_rack.jpg",
    source: "website",
    orderIndex: 28,
    defaultActive: false,
  },
  {
    id: "website-showcase",
    title: "Glass-Front Timber Curio Showcase",
    description:
      "Illuminated glass display showcase designed to frame collectibles and fine tableware.",
    category: "Showcases",
    imagePath: "/images/showcase.jpg",
    source: "website",
    orderIndex: 29,
    defaultActive: false,
  },
  {
    id: "website-wallmount-mirror",
    title: "Carved Teak Wallmount Mirror",
    description:
      "Hand-carved solid teakwood mirror frame sculpted for foyers and dressing suites.",
    category: "Wallmounts and Mirrors",
    imagePath: "/images/mirror.jpg",
    source: "website",
    orderIndex: 30,
    defaultActive: false,
  },
  {
    id: "website-souvenirs",
    title: "Hand-Carved Timber Decor & Souvenirs",
    description:
      "Small-batch decorative carvings turned and relief-sculpted from reclaimed Burma teak offcuts.",
    category: "Souvenirs",
    imagePath: "/images/souvenier.jpg",
    source: "website",
    orderIndex: 31,
    defaultActive: false,
  },
  {
    id: "website-art-of-craft",
    title: "Hand-Chiseled Relief Woodcraft",
    description:
      "Master carver chiseling traditional floral motifs in seasoned teakwood using heritage gouges.",
    category: "Craftsmanship",
    imagePath: "/images/art_of_craft.png",
    source: "website",
    orderIndex: 32,
    defaultActive: false,
  },
  {
    id: "website-left-composition",
    title: "Raw Unfinished Teak 4-Seater Dining Frame",
    description:
      "Unpolished freshly joined raw teakwood table and chairs inside the Timber workshop prior to finishing.",
    category: "Craftsmanship",
    imagePath: "/images/left_side _image.png",
    source: "website",
    orderIndex: 33,
    defaultActive: false,
  },
  {
    id: "website-studio-detail",
    title: "Artisan Lathe Spindle Turning",
    description:
      "Precision wood-turning by hand to shape fluted balusters and signature furniture legs.",
    category: "Craftsmanship",
    imagePath: "/images/media_1789477358584.jpg",
    source: "website",
    orderIndex: 34,
    defaultActive: false,
  },
];

function mapBoutiqueCategory(category: string): string {
  if (category === "Outdoor") return "Outdoor";
  if (category === "Wallmounts and Mirrors") return "Wallmounts and Mirrors";
  return "Souvenirs";
}

export const BOUTIQUE_GALLERY_SEEDS: WebsiteGallerySeed[] = BOUTIQUE_PRODUCTS.map(
  (product, idx) => ({
    id: `boutique-${product.id}`,
    title: product.name,
    description: product.description,
    category: mapBoutiqueCategory(product.category),
    imagePath: product.image,
    source: "boutique",
    orderIndex: 35 + idx,
    defaultActive: false,
  })
);

/** All unique Gallery page + Website + Boutique images (50 items total). */
export const ALL_WEBSITE_GALLERY_SEEDS: WebsiteGallerySeed[] = [
  ...GALLERY_PAGE_SEEDS,
  ...WEBSITE_IMAGE_SEEDS,
  ...BOUTIQUE_GALLERY_SEEDS,
];
