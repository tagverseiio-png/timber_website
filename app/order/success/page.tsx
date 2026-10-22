"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const order = params.get("order");
  const payment = params.get("payment");

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 max-w-xl text-center py-16">
        <CheckCircle2 size={64} className="mx-auto text-green-700 mb-6" />
        <h1 className="font-serif text-4xl text-timber-darkwood mb-4">Payment Successful</h1>
        <p className="text-timber-muted mb-8">
          Thank you for your order. A confirmation has been recorded against your order id.
        </p>
        <div className="bg-white rounded p-6 text-sm text-left mb-8 space-y-2">
          {order && <p><span className="text-timber-muted">Order ID:</span> <span className="font-mono break-all">{order}</span></p>}
          {payment && <p><span className="text-timber-muted">Payment ID:</span> <span className="font-mono break-all">{payment}</span></p>}
        </div>
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
