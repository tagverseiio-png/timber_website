#!/usr/bin/env node
/**
 * One-time catalog migration: legacy v1 rows → canonical v2 schema.
 *
 * v1: {title, price: float ₹, image, type, category, orderIndex, ...}
 * v2: {name, slug, pricePaise: int, images[], currency: "INR",
 *      stock: null, category, type, isActive: true, orderIndex, ...}
 *
 * Money conversion is exact for 2-decimal rupee floats
 * (Math.round(price * 100)). Rows that already have an integer pricePaise
 * are skipped, so re-running is safe.
 *
 *   Dry run (default, changes NOTHING):
 *     node migrate-catalog-paise.mjs
 *   Apply:
 *     node migrate-catalog-paise.mjs --apply
 *
 * Env: same as server/set-admin-claim.mjs (GOOGLE_APPLICATION_CREDENTIALS
 * or FIREBASE_SERVICE_ACCOUNT_JSON + FIREBASE_DATABASE_URL).
 */
import admin from "firebase-admin";

const APPLY = process.argv.includes("--apply");

function loadCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON (see server/.env.example)."
    );
  }
  return admin.credential.cert(JSON.parse(raw));
}

admin.initializeApp({
  ...(loadCredential() ? { credential: loadCredential() } : {}),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const slugify = (s) =>
  String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "product";

const snap = await admin.database().ref("projects").get();
const data = snap.val() ?? {};
const keys = Object.keys(data);
let migrated = 0;
let skipped = 0;
const updates = {};

for (const key of keys) {
  const row = data[key] ?? {};
  if (Number.isInteger(row.pricePaise)) {
    skipped += 1;
    continue;
  }
  const price = Number(row.price);
  if (!Number.isFinite(price) || price < 0) {
    console.warn(`SKIP ${key}: unparseable price ${JSON.stringify(row.price)}`);
    skipped += 1;
    continue;
  }
  const name = row.name ?? row.title ?? "Untitled product";
  updates[`${key}/name`] = name;
  updates[`${key}/slug`] = row.slug ?? slugify(name);
  updates[`${key}/pricePaise`] = Math.round(price * 100);
  updates[`${key}/images`] = Array.isArray(row.images) ? row.images : row.image ? [row.image] : [];
  updates[`${key}/currency`] = row.currency ?? "INR";
  if (row.stock === undefined) updates[`${key}/stock`] = null;
  if (row.isActive === undefined) updates[`${key}/isActive`] = true;
  migrated += 1;
}

console.log(`Rows: ${keys.length}, to migrate: ${migrated}, skipped: ${skipped}`);
console.log(APPLY ? "Applying…" : "Dry run — pass --apply to write.");
if (APPLY && migrated > 0) {
  await admin.database().ref("projects").update(updates);
  // Marker lives OUTSIDE /projects so the storefront never sees it as a product.
  await admin.database().ref("_migration/catalogPaise").set(admin.database.ServerValue.TIMESTAMP);
  console.log("Migration applied.");
}
process.exit(0);
