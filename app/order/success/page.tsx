"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Package } from "lucide-react";
import { onValue, ref as dbRef, type DatabaseReference } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { formatPrice } from "@/lib/money";

/**
 * Payment success + live tracking. The checkout flow signs the customer in
 * ANONYMOUSLY and that uid owns the order (see /create-order), so while the
 * same browser session lives, database rules allow reading orders/{id} —
 * we subscribe and surface payment + shipping status here, live.
 */
interface OrderView {
  status?: string;
  amountPaise?: number;
  currency?: string;
  items?: { name: string; qty: number; pricePaise: number }[];
  customer?: { name?: string };
  shiprocket?: { awb?: string; courierName?: string; state?: string; orderId?: string };
  shippingTimeline?: Record<string, { state?: string; event?: string; receivedAt?: number }>;
}

const STATUS_TEXT: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending payment", cls: "bg-gray-100 text-gray-700" },
  paid: { label: "Paid — being packed", cls: "bg-green-100 text-green-800" },
  processing: { label: "Accepted — courier being assigned", cls: "bg-blue-100 text-blue-800" },
  shipped: { label: "Shipped", cls: "bg-indigo-100 text-indigo-800" },
  out_for_delivery: { label: "Out for delivery", cls: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Delivered", cls: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Payment failed", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", cls: "bg-yellow-100 text-yellow-800" },
  rto: { label: "Return in progress", cls: "bg-orange-100 text-orange-800" },
};

function shiprocketTrackingUrl(awb?: string): string | null {
  return awb ? `https://shiprocket.co/tracking/${encodeURIComponent(awb)}` : null;
}

function SuccessContent() {
  const params = useSearchParams();
  const order = params.get("order");
  const payment = params.get("payment");

  const [orderView, setOrderView] = useState<OrderView | null>(null);
  const [trackingAvailable, setTrackingAvailable] = useState<boolean | null>(null);

  // Live order subscription. Only when a signed-in session exists that also
  // owns the order — database rules deny everything else (we do NOT open reads).
  useEffect(() => {
    if (!order || !auth.currentUser) return;
    let unsub: (() => void) | null = null;
    let orderRef: DatabaseReference | null = null;
    try {
      orderRef = dbRef(database, `orders/${order}`);
      unsub = onValue(
        orderRef,
        (snap) => {
          const data = snap.val() as OrderView | null;
          setOrderView(data);
          setTrackingAvailable(!!data);
        },
        () => setTrackingAvailable(false) // rules denied / VM not written yet
      );
    } catch {
      // Subscription setup should not fail; if it does, stay silent and let
      // the render fall back to the offline note.
      unsub = null;
    }
    return () => unsub?.();
  }, [order]);

  const status = orderView?.status ?? "pending";
  const badge = STATUS_TEXT[status] ?? STATUS_TEXT.pending;
  const timeline = Object.values(orderView?.shippingTimeline ?? {})
    .sort((a, b) => (b.receivedAt ?? 0) - (a.receivedAt ?? 0))
    .slice(0, 5);
  const trackUrl = shiprocketTrackingUrl(orderView?.shiprocket?.awb);
  // Offline note: fresh browser session (no auth) or rules denied the read.
  const showOfflineNote = !auth.currentUser || trackingAvailable === false;

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 max-w-xl text-center py-16">
        <CheckCircle2 size={64} className="mx-auto text-green-700 mb-6" />
        <h1 className="font-serif text-4xl text-timber-darkwood mb-4">Payment Successful</h1>
        <p className="text-timber-muted mb-8">
          Thank you for your order. A confirmation has been recorded against your order id.
        </p>

        <div className="bg-white rounded p-6 text-sm text-left mb-6 space-y-2">
          {order && (
            <p>
              <span className="text-timber-muted">Order ID:</span>{" "}
              <span className="font-mono break-all">{order}</span>
            </p>
          )}
          {payment && (
            <p>
              <span className="text-timber-muted">Payment ID:</span>{" "}
              <span className="font-mono break-all">{payment}</span>
            </p>
          )}
          {orderView?.customer?.name && (
            <p>
              <span className="text-timber-muted">Deliver to:</span> {orderView.customer.name}
            </p>
          )}
          {orderView?.amountPaise != null && (
            <p>
              <span className="text-timber-muted">Amount paid:</span>{" "}
              {formatPrice(orderView.amountPaise, orderView.currency ?? "INR")}
            </p>
          )}
        </div>

        {/* Live status card — appears as soon as the order doc is readable. */}
        {orderView && (
          <div className="bg-white rounded p-6 text-left mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package size={20} className="text-timber-darkwood" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <ul className="text-sm divide-y divide-timber-darkwood/10 mb-2">
              {(orderView.items ?? []).map((i, idx) => (
                <li key={idx} className="py-2 flex justify-between">
                  <span>
                    {i.name} × {i.qty}
                  </span>
                  <span className="font-medium">{formatPrice(i.pricePaise * i.qty, orderView.currency ?? "INR")}</span>
                </li>
              ))}
            </ul>
            {orderView.shiprocket?.awb && (
              <p className="text-xs text-timber-muted">
                AWB <span className="font-mono">{orderView.shiprocket.awb}</span>
                {orderView.shiprocket.courierName ? ` · ${orderView.shiprocket.courierName}` : ""}
                {trackUrl && (
                  <>
                    {" · "}
                    <a href={trackUrl} target="_blank" rel="noreferrer" className="underline">
                      Track shipment
                    </a>
                  </>
                )}
              </p>
            )}
            {timeline.length > 0 && (
              <ol className="text-xs text-timber-muted mt-3 space-y-1 list-disc list-inside">
                {timeline.map((t, idx) => (
                  <li key={idx}>
                    {(t.state ?? t.event ?? "update").replace(/_/g, " ")}
                    {t.receivedAt ? ` — ${new Date(t.receivedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {order && showOfflineNote && (
          <p className="text-xs text-timber-muted mb-6">
            Live tracking is available in the same browser session you paid from. Save your Order ID —
            support can look it up any time.
          </p>
        )}

        <Link href="/shop" className="inline-block px-8 py-3 bg-timber-darkwood text-timber-beige tracking-wide">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-timber-beige flex items-center justify-center">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
