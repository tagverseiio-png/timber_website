"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { env } from "@/lib/env";
import { useCartStore, type CartLine } from "@/store/useCartStore";
import { useCatalog } from "@/lib/products/catalog";
import type { CatalogProduct } from "@/lib/products/types";
import { formatPrice } from "@/lib/money";
import { loadRazorpayScript, postToPaymentApi, type RazorpaySuccess } from "@/lib/razorpay";
import { getCustomerProfile } from "@/lib/auth/customerAuth";

/**
 * Checkout: sends ONLY [{id, qty}] to the VM along with customer + address
 * details. The server re-validates everything server-side, re-reads prices,
 * creates the Razorpay order, and returns {orderId, amount, keyId}.
 * The client amount is never trusted and never sent.
 */

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

interface AddressForm {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: AddressForm = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

/** Must mirror server/src/orders.js validateCustomer/validateAddress exactly. */
function validateAddressForm(a: AddressForm): string | null {
  if (a.name.trim().length < 2 || a.name.trim().length > 80) return "Full name: 2–80 characters.";
  if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) return "Email looks invalid.";
  const digits = a.phone.replace(/\D/g, "");
  // Must mirror server/src/orders.js validateCustomer/validateAddress exactly:
  // phone = ^(\d{10}|\d{12}|\d{11,13})$ → 10–13 digits.
  if (digits.length < 10 || digits.length > 13) return "Phone: a 10-digit Indian number (or with dial code).";
  if (a.line1.trim().length < 3 || a.line1.trim().length > 200) return "Address line 1: 3–200 characters.";
  if (a.line2.trim().length > 100) return "Address line 2: max 100 characters.";
  if (a.city.trim().length < 2 || a.city.trim().length > 80) return "City: 2–80 characters.";
  if (a.state.trim().length < 2 || a.state.trim().length > 80) return "State is required.";
  if (!/^[1-9]\d{5}$/.test(a.pincode.trim())) return "Pincode: 6 digits, first not 0.";
  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines } = useCartStore();
  const { products, loading: catalogLoading } = useCatalog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);
  const [addr, setAddr] = useState<AddressForm>(EMPTY_ADDRESS);
  const [customerUser, setCustomerUser] = useState<User | null>(null);

  // Auto-populate customer info and default address if logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
        setCustomerUser(currentUser);
        try {
          const profile = await getCustomerProfile(currentUser.uid);
          setAddr((prev) => ({
            ...prev,
            name: prev.name || profile?.name || currentUser.displayName || "",
            email: prev.email || profile?.email || currentUser.email || "",
            phone: prev.phone || profile?.phone || "",
            line1: prev.line1 || profile?.address?.line1 || "",
            line2: prev.line2 || profile?.address?.line2 || "",
            city: prev.city || profile?.address?.city || "",
            state: prev.state || profile?.address?.state || "",
            pincode: prev.pincode || profile?.address?.pincode || "",
          }));
        } catch {
          // ignore
        }
      } else {
        setCustomerUser(null);
      }
    });
    return () => unsub();
  }, []);
  const [quote, setQuote] = useState<{
    ok: boolean;
    note: string;
    shippingPaise?: number;
    shippingCourier?: string;
  } | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);

  // Live shipping estimate: once a full pincode is entered, ask the VM (which
  // asks Shiprocket) with the ACTUAL cart lines so the parcel weight — and
  // therefore the estimated cheapest-courier cost — matches what /create-order
  // charges. Deliberately SILENT when the VM is unreachable (estimate only,
  // never a checkout blocker; the charge is still computed server-side).
  useEffect(() => {
    if (addr.pincode.length !== 6) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setQuoteBusy(true);
      postToPaymentApi<{
        serviceable: boolean;
        couriers: { name: string; etaDate: string; rate?: number }[];
        cheapest?: { name: string; etaDate: string; rate: number } | null;
      }>("/shipping/quote", {
        pincode: addr.pincode,
        items: lines.map((l) => ({ id: l.id, qty: l.qty })),
      })
        .then((r) => {
          if (cancelled) return;
          if (r.serviceable && r.couriers.length > 0) {
            const fastest = r.couriers[0];
            const cheapest = r.cheapest ?? null;
            setQuote({
              ok: true,
              note: `Serviceable — ${r.couriers.length} courier${r.couriers.length > 1 ? "s" : ""}${
                fastest.etaDate ? `, fastest delivery around ${fastest.etaDate}` : ""
              }.`,
              shippingPaise:
                cheapest && Number.isFinite(cheapest.rate)
                  ? Math.round(cheapest.rate * 100)
                  : undefined,
              shippingCourier: cheapest?.name,
            });
          } else {
            setQuote({ ok: false, note: "No prepaid courier services this pincode yet." });
          }
        })
        .catch(() => {
          if (!cancelled) setQuote(null); // VM down/unconfigured — stay quiet
        })
        .finally(() => {
          if (!cancelled) setQuoteBusy(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addr.pincode, lines]);

  const detailed = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.id) }))
    .filter((d): d is { line: CartLine; product: CatalogProduct } => d.product !== undefined);
  const totalPaise = detailed.reduce((sum, d) => sum + d.product.pricePaise * d.line.qty, 0);
  const currency = detailed[0]?.product.currency ?? "INR";
  // Ghost cart: persisted lines whose product was deleted/hidden silently
  // disappeared above. Paying must be blocked — the server would only 400
  // AFTER the user filled the whole address form.
  const ghostLines = detailed.length !== lines.length;

  const pay = async () => {
    setBusy(true);
    setError(null);
    setPaymentModalError(null);
    try {
      if (lines.length === 0) throw new Error("Your cart is empty.");
      if (ghostLines || detailed.length === 0)
        throw new Error(
          "Some items in your cart are no longer available. Please remove them and try again."
        );
      if (totalPaise < 100) throw new Error("Order total must be at least ₹1.");

      const addressError = validateAddressForm(addr);
      if (addressError) throw new Error(addressError);

      // Guest checkout: an anonymous uid lets the VM attribute the order and
      // lets database rules allow the owner to read their own order later.
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const idToken = await user.getIdToken();

      const order = await postToPaymentApi<{ orderId: string; amount: number; currency: string; keyId: string }>(
        "/create-order",
        {
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          customer: { name: addr.name.trim(), email: addr.email.trim(), phone: addr.phone.trim() },
          address: {
            line1: addr.line1.trim(),
            line2: addr.line2.trim(),
            city: addr.city.trim(),
            state: addr.state.trim(),
            pincode: addr.pincode.trim(),
          },
        },
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
            // Money is CAPTURED at this point — a plain error leaves the user
            // trapped on checkout, and a retry would charge them twice. Route
            // them to the order page: it reads live DB state (the payment
            // webhook usually marks the order paid within seconds) and shows
            // the real status either way.
            setBusy(false);
            router.push(
              `/order/success?order=${order.orderId}&payment=awaiting&reason=${encodeURIComponent(
                e instanceof Error ? e.message : "verification failed"
              )}`
            );
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
        // Do NOT navigate: Razorpay keeps the modal open and the user can
        // retry against the SAME order. Routing away created a second order
        // on retry (double charge). Show an inline error; navigate only when
        // they dismiss the modal (handled in modal.ondismiss).
        setBusy(false);
        setPaymentModalError(
          resp?.error?.description ?? "Payment failed — you can retry or close the window."
        );
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

        {!customerUser && (
          <div className="mb-6 p-4 rounded-xl bg-white/80 border border-timber-darkwood/10 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <span className="text-timber-muted">
              Already have an account? Sign in for saved addresses and live order tracking.
            </span>
            <Link
              href="/account/login?redirect=/checkout"
              className="text-timber-teal font-semibold hover:underline shrink-0"
            >
              Sign In &rarr;
            </Link>
          </div>
        )}

        {catalogLoading ? (
          <p className="text-timber-muted">Loading order summary…</p>
        ) : lines.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-timber-muted mb-8">Your cart is empty.</p>
            <Link href="/shop" className="inline-block px-8 py-3 bg-timber-darkwood text-timber-beige">
              Back to Shop
            </Link>
          </div>
        ) : detailed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-timber-muted mb-8">
              Items in your cart are no longer available — they were removed or hidden by the store.
            </p>
            <Link href="/cart" className="inline-block px-8 py-3 border border-timber-darkwood text-timber-darkwood mr-3">
              View Cart
            </Link>
            <Link href="/shop" className="inline-block px-8 py-3 bg-timber-darkwood text-timber-beige">
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-8 rounded">
            <h2 className="font-serif text-2xl text-timber-darkwood mb-4">Order Summary</h2>
            <ul className="divide-y divide-timber-darkwood/10 mb-4">
              {detailed.map(({ line, product }) => (
                <li key={line.id} className="py-3 flex justify-between text-sm">
                  <span>{product!.name} × {line.qty}</span>
                  <span className="font-medium">{formatPrice(product!.pricePaise * line.qty, product!.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm pb-2">
              <span>Subtotal</span>
              <span className="font-medium">{formatPrice(totalPaise, currency)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-timber-darkwood/10 pt-3 pb-2">
              <span>
                Shipping
                {quoteBusy && addr.pincode.length === 6 ? (
                  <span className="text-timber-muted"> — checking…</span>
                ) : quote?.ok && quote.shippingPaise != null ? (
                  <span className="text-timber-muted text-xs"> {quote.shippingCourier ? `(${quote.shippingCourier})` : ""}</span>
                ) : null}
              </span>
              <span className="font-medium">
                {quote?.ok && quote.shippingPaise != null ? (
                  formatPrice(quote.shippingPaise, currency)
                ) : addr.pincode.length === 6 ? (
                  <span className="text-timber-muted text-xs">based on pincode</span>
                ) : (
                  <span className="text-timber-muted text-xs">enter pincode</span>
                )}
              </span>
            </div>
            <div className="flex justify-between font-medium text-xl border-t border-timber-darkwood/10 pt-4 mb-2">
              <span>Total</span>
              <span>
                {formatPrice(
                  totalPaise + (quote?.ok && quote.shippingPaise != null ? quote.shippingPaise : 0),
                  currency
                )}
                <span className={
                  quote?.ok && quote.shippingPaise != null ? "hidden" : "text-sm text-timber-muted font-normal"
                }>
                  {" "}+ shipping
                </span>
              </span>
            </div>
            <p className="text-xs text-timber-muted mb-6">
              Shipping is charged at the cheapest available courier rate, fixed securely on our
              payment server when you pay — the above is an estimate.
            </p>
            {quote && !quote.ok && (
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded mb-4">{quote.note}</p>
            )}

            {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded mb-4">{error}</p>}
            {paymentModalError && (
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded mb-4">{paymentModalError}</p>
            )}

            <div className="mt-6">
              <h2 className="font-serif text-2xl text-timber-darkwood mb-4">Delivery Address</h2>
              <p className="text-xs text-timber-muted mb-4">
                Shipped via Shiprocket — verified on our payment server before charging.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                  <input
                    type="text"
                    value={addr.name}
                    onChange={(e) => setAddr({ ...addr, name: e.target.value })}
                    maxLength={80}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10-digit) *</label>
                  <input
                    type="tel"
                    value={addr.phone}
                    onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                    maxLength={13}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional — delivery updates)</label>
                <input
                  type="email"
                  value={addr.email}
                  onChange={(e) => setAddr({ ...addr, email: e.target.value })}
                  maxLength={254}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address line 1 *</label>
                <input
                  type="text"
                  value={addr.line1}
                  onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
                  maxLength={200}
                  placeholder="House / flat / street"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address line 2 <span className="text-timber-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addr.line2}
                  onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
                  maxLength={100}
                  placeholder="Landmark, apartment name"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={addr.city}
                    onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                    maxLength={80}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select
                    value={addr.state}
                    onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood bg-white"
                    required
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={addr.pincode}
                  onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  maxLength={6}
                  placeholder="6 digits"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                  required
                />
                {quoteBusy && addr.pincode.length === 6 && (
                  <p className="text-xs text-timber-muted mt-1">Checking delivery options…</p>
                )}
                {!quoteBusy && quote && addr.pincode.length === 6 && (
                  <p className={`text-xs mt-1 ${quote.ok ? "text-green-700" : "text-red-700"}`}>{quote.note}</p>
                )}
              </div>
            </div>

            <button
              onClick={pay}
              disabled={busy}
              className="mt-8 w-full bg-timber-teal text-white py-4 text-sm font-medium tracking-wider uppercase hover:bg-timber-darkwood transition-colors disabled:opacity-50"
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
