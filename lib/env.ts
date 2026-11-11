/**
 * Typed, validated access to client-side environment variables.
 *
 * NOTE: Next.js / Turbopack inlines `process.env.NEXT_PUBLIC_*` into client
 * bundles only when accessed as literal member expressions (e.g. process.env.KEY).
 * Dynamic access like process.env[name] does NOT get inlined by the compiler.
 *
 * Production fallback defaults are provided for public, non-secret client values
 * so that any build (Vercel preview, production, or local) functions smoothly.
 */

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB4wMZ0rw8ri5YFFrFPcR8eKtFmqml5OEs";
const FIREBASE_AUTH_DOMAIN =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "timber-15a4d.firebaseapp.com";
const FIREBASE_DATABASE_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://timber-15a4d-default-rtdb.asia-southeast1.firebasedatabase.app";
const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "timber-15a4d";
const FIREBASE_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "timber-15a4d.firebasestorage.app";
const FIREBASE_MESSAGING_SENDER_ID =
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "309983994119";
const FIREBASE_APP_ID =
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:309983994119:web:f0bd1327b00a4a739125a2";
const FIREBASE_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.timberteak.com";
const CURRENCY =
  process.env.NEXT_PUBLIC_CURRENCY || "INR";
const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TtAJiKuy9j7ZEb";
const PAYMENT_API_URL =
  process.env.NEXT_PUBLIC_PAYMENT_API_URL || "https://pay.timberteak.com";

export const env = {
  firebase: {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    databaseURL: FIREBASE_DATABASE_URL,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID,
  },
  siteUrl: SITE_URL,
  currency: CURRENCY,
  razorpayKeyId: RAZORPAY_KEY_ID,
  paymentApiUrl: PAYMENT_API_URL,
} as const;

export type AppEnv = typeof env;
