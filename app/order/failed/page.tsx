"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { XCircle } from "lucide-react";

function FailedContent() {
  const params = useSearchParams();
  const order = params.get("order");
  const reason = params.get("reason");

  return (
    <div className="bg-timber-beige min-h-screen pt-10 pb-32">
      <div className="container mx-auto px-6 max-w-xl text-center py-16">
        <XCircle size={64} className="mx-auto text-red-700 mb-6" />
        <h1 className="font-serif text-4xl text-timber-darkwood mb-4">Payment Not Completed</h1>
        <p className="text-timber-muted mb-2">
          {reason ?? "The payment did not go through. No amount has been charged."}
        </p>
        {order && (
          <p className="text-xs text-timber-muted mb-8 font-mono break-all">Order ref: {order}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/cart" className="px-8 py-3 bg-timber-teal text-white tracking-wide">
            Back to Cart
          </Link>
          <Link href="/shop" className="px-8 py-3 border border-timber-darkwood text-timber-darkwood tracking-wide">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-timber-beige flex items-center justify-center">Loading…</div>}>
      <FailedContent />
    </Suspense>
  );
}
