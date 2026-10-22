/**
 * Typed, validated access to client-side environment variables.
 *
 * Import this module (not process.env directly) from client code.
 * It throws at startup if a required variable is missing, so a
 * misconfigured Vercel deployment fails loudly instead of silently
 * initializing Firebase with `undefined`.
 *
 * Only NEXT_PUBLIC_ (non-secret) values belong here. Razorpay secrets,
 * webhook secrets and the Firebase Admin service account must live ONLY
 * on the payment VM — see server/.env.example.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable ${name}. ` +
        `Copy .env.example to .env.local (local) or set it in Vercel Project Settings.`
    );
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  firebase: {
    apiKey: required("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: required("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    databaseURL: required("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
    projectId: required("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: required("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: required("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: required("NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: optional("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
  },
  siteUrl: optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  currency: optional("NEXT_PUBLIC_CURRENCY", "INR"),
  razorpayKeyId: optional("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
  /** VM base URL, e.g. https://pay.example.com — required for checkout. */
  paymentApiUrl: optional("NEXT_PUBLIC_PAYMENT_API_URL"),
} as const;

export type AppEnv = typeof env;
