import type { NextConfig } from "next";

// Content-Security-Policy (Report-Only first): allow self, Firebase SDKs
// (RTDB + storage + auth), Razorpay checkout script/frame/pixel-beacons,
// Google Maps embed on /contact, and unsplash images via img-src.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://firebasestorage.googleapis.com https://*.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com",
  "font-src 'self' data:",
  "connect-src 'self' https://pay.timberteak.com https://*.firebaseio.com https://*.firebasedatabase.app https://firebasestorage.googleapis.com https://firebasestorage.cloudfunction.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://api.razorpay.com https://lumberjack.razorpay.com https://api-web.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // Report-only first: watch the Universal Dashboard for violations before
  // flipping to enforcing Content-Security-Policy.
  { key: "Content-Security-Policy-Report-Only", value: cspDirectives },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // X-Frame-Options is deprecated next to frame-ancestors, but old tooling still reads it.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com"), usb=(), xr-spatial-tracking=()',
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Product images uploaded via the admin panel (Firebase Storage).
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/gallery",
        destination: "/projects",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
