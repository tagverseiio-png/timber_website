"use client";

import { env } from "@/lib/env";

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  theme?: { color?: string };
  handler: (r: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay Checkout.js exactly once. */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = CHECKOUT_JS;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load the Razorpay checkout script."));
      };
      document.body.appendChild(el);
    });
  }
  return scriptPromise;
}

export async function postToPaymentApi<T>(path: string, body: unknown, idToken?: string): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Use same-origin Next.js proxy route to bypass all browser CORS restrictions:
  const url = typeof window !== "undefined"
    ? `/api/payment${cleanPath}`
    : `${(env.paymentApiUrl || "https://pay.timberteak.com").replace(/\/$/, "")}${cleanPath}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.error || data.message || `Payment request failed (${res.status}).`);
  }
  return data;
}
