import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { SITE_NAME, canonical, getSiteUrl } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | Premium Wood Furniture`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Crafted by Nature. Designed for Life. Premium handcrafted timber furniture — sustainably sourced solid wood, built for generations.",
  alternates: { canonical: canonical("/") },
  openGraph: {
    title: `${SITE_NAME} | Premium Wood Furniture`,
    description:
      "Premium handcrafted timber furniture — sustainably sourced solid wood, built for generations.",
    url: canonical("/"),
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: canonical("/images/logo.png"), alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Premium Wood Furniture`,
    description:
      "Premium handcrafted timber furniture — sustainably sourced solid wood, built for generations.",
    images: [canonical("/images/logo.png")],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#2c1e16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-timber-darkwood bg-timber-beige">
        <CustomCursor />
        <Navbar />
        <main className="flex-grow pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
