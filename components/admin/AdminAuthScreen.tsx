"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Shared Firebase login screen for Timber admin routes.
 */
export function AdminLoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-timber-beige flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-serif text-timber-darkwood mb-2 text-center">Admin Portal</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Sign in with an admin account</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
              required
            />
          </div>
          {loginError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{loginError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-timber-darkwood text-timber-beige py-2 rounded-md hover:opacity-90 transition font-medium disabled:opacity-50"
          >
            {submitting ? "Signing In…" : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Shared access-denied screen when a signed-in user lacks admin permissions.
 */
export function AdminAccessDeniedCard({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-timber-beige flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-serif text-timber-darkwood mb-2">Access denied</h1>
        <p className="text-gray-500 text-sm mb-1">Signed in as {user.email}.</p>
        <p className="text-gray-500 text-sm mb-6">
          This account has no admin claim. Ask an existing admin to run
          <code className="block mt-2 text-xs bg-gray-100 p-2 rounded">
            node set-admin-claim.mjs {user.email}
          </code>
          on the payment VM, then sign in again.
        </p>
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="px-6 py-2 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

