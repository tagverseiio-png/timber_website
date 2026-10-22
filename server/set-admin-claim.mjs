#!/usr/bin/env node
/**
 * Grant (or revoke) the `admin: true` custom claim for a Firebase Auth user.
 *
 * This is the ONLY supported way to make someone an admin. The client-side
 * admin panel only *reads* the claim; RTDB/Storage rules *enforce* it.
 *
 *   On the VM:
 *     npm install            # installs firebase-admin (uses server/package.json)
 *     node set-admin-claim.mjs admin@example.com          # grant
 *     node set-admin-claim.mjs admin@example.com --revoke # revoke
 *
 * Required env (see server/.env.example):
 *   FIREBASE_DATABASE_URL, plus ONE of:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json  (preferred)
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' (single line)
 *
 * After granting, the user must sign out + sign back in (the admin panel
 * also forces a token refresh, so it usually picks the claim up directly).
 */
import admin from "firebase-admin";

const [email, flag] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error("Usage: node set-admin-claim.mjs <email> [--revoke]");
  process.exit(1);
}
const revoke = flag === "--revoke";

function loadCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null; // ADC
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON (see server/.env.example)."
    );
  }
  return admin.credential.cert(JSON.parse(raw));
}

const credential = loadCredential();
admin.initializeApp({
  ...(credential ? { credential } : {}),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, revoke ? {} : { admin: true });
// Force a token refresh so the claim takes effect on next request.
await admin.auth().revokeRefreshTokens(user.uid);

console.log(
  revoke
    ? `Revoked admin claim for ${email} (uid ${user.uid}).`
    : `Granted admin claim for ${email} (uid ${user.uid}). Ask them to re-login.`
);
process.exit(0);
