"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInWithGoogle } from "@/lib/auth/customerAuth";
import Link from "next/link";
import { Package, MapPin, Heart, ShieldCheck, AlertCircle } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if customer is already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        router.replace(redirectPath);
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router, redirectPath]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push(redirectPath);
    } catch (err: unknown) {
      if (err instanceof Error) {
        // If user simply closed the popup window, don't show a loud error
        if (err.message.includes("popup-closed-by-user") || err.message.includes("cancelled-popup-request")) {
          setLoading(false);
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-timber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="bg-timber-beige min-h-screen pt-24 pb-32 px-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-timber-darkwood/10 p-8 sm:p-10 text-center">
        {/* Brand */}
        <Link href="/" className="font-serif text-3xl font-bold text-timber-darkwood block mb-2 tracking-wide">
          TIMBER.
        </Link>
        <span className="text-[11px] uppercase tracking-widest text-timber-teal font-semibold block mb-4">
          House of Exclusive
        </span>

        <h1 className="font-serif text-2xl text-timber-darkwood font-bold mb-3">
          Sign In or Sign Up
        </h1>
        <p className="text-timber-muted text-sm leading-relaxed mb-8">
          One-click access with your Google account. Track your shipments, manage delivery addresses, and view your saved pieces.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm rounded-2xl border border-gray-300 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-3.5 group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-timber-teal border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Official Google G SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.08-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.08 3.15c.94-2.83 3.58-4.96 6.68-4.96z"
                />
              </svg>
              <span className="text-gray-700 font-medium tracking-wide">Continue with Google</span>
            </>
          )}
        </button>

        {/* Security Note */}
        <p className="text-[11px] text-timber-muted/70 mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Instant, passwordless authentication secured by Google</span>
        </p>

        {/* Feature Highlights */}
        <div className="mt-8 pt-8 border-t border-timber-darkwood/10 text-left space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-timber-teal/10 text-timber-teal flex items-center justify-center shrink-0 mt-0.5">
              <Package size={15} />
            </div>
            <div>
              <p className="text-xs font-semibold text-timber-darkwood">Live Order Tracking</p>
              <p className="text-[11px] text-timber-muted">Real-time Shiprocket AWB updates from workshop to doorstep.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-timber-teal/10 text-timber-teal flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={15} />
            </div>
            <div>
              <p className="text-xs font-semibold text-timber-darkwood">Saved Delivery Addresses</p>
              <p className="text-[11px] text-timber-muted">Seamless one-click address prefill at checkout.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-timber-teal/10 text-timber-teal flex items-center justify-center shrink-0 mt-0.5">
              <Heart size={15} />
            </div>
            <div>
              <p className="text-xs font-semibold text-timber-darkwood">Persistent Wishlist</p>
              <p className="text-[11px] text-timber-muted">Save and compare your favorite solid wood pieces.</p>
            </div>
          </div>
        </div>

        {/* Terms footer */}
        <p className="text-[10px] text-timber-muted/60 mt-8">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-timber-teal">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-timber-teal">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
