import { redirect } from "next/navigation";

const CATEGORY_MAP: Record<string, string> = {
  chairs: "Chairs",
  cots: "Cots",
  beds: "Cots",
  tables: "Tables",
  cabinets: "Wardrobes",
  wardrobes: "Wardrobes",
  sofas: "Sofas",
  outdoor: "Outdoor",
  "bar-units": "Bar Units",
  "book-shelves": "Book Shelves",
  buffets: "Buffets",
  "chest-boxes": "Chest Boxes",
  "chest-of-draws": "Chest of Draws",
  diwans: "Diwans",
  "puja-units": "Puja Units",
  "shoe-racks": "Shoe Racks",
  showcases: "Showcases",
  souvenirs: "Souvenirs",
};

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalized = (slug || "").toLowerCase().trim();
  const matched = CATEGORY_MAP[normalized];

  if (matched) {
    redirect(`/shop?category=${encodeURIComponent(matched)}`);
  }

  // Fallback: title-case the slug
  const titleCased = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  redirect(`/shop?category=${encodeURIComponent(titleCased)}`);
}
