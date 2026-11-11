import type { MetadataRoute } from "next";

// TODO(manual): replace with purpose-built 192/512px PNG icons for
// installability; favicon.ico keeps this valid until then.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Timber — Premium Wood Furniture",
    short_name: "Timber",
    description: "Handcrafted solid-wood furniture, sustainably sourced and built for generations.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0e6",
    theme_color: "#2c1e16",
    // NOTE(manual): replace with a square 192/512px brand icon when one is
    // made — the current logo is a wide wordmark and looks letterboxed.
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/icons/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
