"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { env } from "@/lib/env";
import { useCartStore, type CartLine } from "@/store/useCartStore";
import { useCatalog } from "@/lib/products/catalog";
import type { CatalogProduct } from "@/lib/products/types";
import { formatPrice } from "@/lib/money";
import { loadRazorpayScript, postToPaymentApi, type RazorpaySuccess } from "@/lib/razorpay";

/**
 * Checkout: sends ONLY [{id, qty}] to the VM. The server re-reads prices,
 * creates the Razorpay order, and returns {orderId, amount, keyId}.
 * The client amount is never trusted and never sent.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { lines } = useCartStore();
  const { products, loading: catalogLoading } = useCatalog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailed = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.id) }))
    .filter((d): d is { line: CartLine; product: CatalogProduct } => d.product !== undefined);
  const totalPaise = detailed.reduce((sum, d) => sum + d.product.pricePaise * d.line.qty, 0);
  const currency = detailed[0]?.product.currency ?? "INR";

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      if (lines.length === 0) throw new Error("Your cart is empty.");

      // Guest checkout: an anonymous uid lets the VM attribute the order and
      // lets Firestore rules allow the owner to read their own order later.
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const idToken = await user.getIdToken();

      const order = await postToPaymentApi<{ orderId: string; amount: number; currency: string; keyId: string }>(
        "/create-order",
        { items: lines.map((l) => ({ id: l.id, qty: l.qty })) },
        idToken
      );

      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay failed to initialize.");

      const rz = new window.Razorpay({
        key: order.keyId || env.razorpayKeyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Timber Furniture Co.",
        description: `${detailed.length} item(s)`,
        theme: { color: "#1a4341" },
        handler: async (resp: RazorpaySuccess) => {
          try {
            const verdict = await postToPaymentApi<{ status: string }>(
              "/verify-payment",
              {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }
            );
            if (verdict.status === "paid") {
              useCartStore.getState().clear();
              router.push(`/order/success?order=${resp.razorpay_order_id}&payment=${resp.razorpay_payment_id}`);
            } else {
              router.push(`/order/failed?order=${resp.razorpay_order_id}&reason=${encodeURIComponent(`Payment ${verdict.status}`)}`);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : "Verification failed.");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            router.push(`/order/failed?order=${order.orderId}&reason=${encodeURIComponent("Payment window closed before completion")}`);
          },
        },
      });

      rz.on("payment.failed", (resp) => {
        setBusy(false);
        const reason = resp?.error?.description ?? "Payment failed";
        router.push(`/order/failed?order=${order.orderId}&reason=${encodeURIComponent(reason)}`);
      });

      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  };

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 md:px-12 max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-8">Checkout</h1>

        {catalogLoading ? (
          <p className="text-timber-muted">Loading order summary…</p>
        ) : lines.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-timber-muted mb-8">Your cart is empty.</p>
            <Link href="/shop" className="inline-block px-8 py-3 bg-timber-darkwood text-timber-beige">
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-8 rounded">
            <h2 className="font-serif text-2xl text-timber-darkwood mb-4">Order Summary</h2>
            <ul className="divide-y divide-timber-darkwood/10 mb-6">
              {detailed.map(({ line, product }) => (
                <li key={line.id} className="py-3 flex justify-between text-sm">
                  <span>{product!.name} × {line.qty}</span>
                  <span className="font-medium">{formatPrice(product!.pricePaise * line.qty, product!.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-medium text-xl border-t border-timber-darkwood/10 pt-4 mb-2">
              <span>Total</span>
              <span>{formatPrice(totalPaise, currency)}</span>
            </div>
            <p className="text-xs text-timber-muted mb-6">
              Final amount is computed securely on our payment server — the price shown here is indicative.
            </p>

            {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded mb-4">{error}</p>}

            <button
              onClick={pay}
              disabled={busy}
              className="w-full bg-timber-teal text-white py-4 text-sm font-medium tracking-wider uppercase hover:bg-timber-darkwood transition-colors disabled:opacity-50"
            >
              {busy ? "Processing…" : `Pay ${formatPrice(totalPaise, currency)}`}
            </button>
            <p className="text-xs text-timber-muted text-center mt-4">Secured by Razorpay · UPI, cards, netbanking</p>
          </div>
        )}
      </div>
    </div>
  );
}
