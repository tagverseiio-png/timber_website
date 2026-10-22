/**
 * Money helpers — the single rule: amounts are stored and computed as
 * INTEGER paise everywhere. Formatting to display string happens ONLY here,
 * at the render boundary. Never hardcode "₹" or "$" in components.
 */

export const INR_CURRENCY = "INR" as const;
export const IN_LOCALE = "en-IN" as const;

/** Display-only formatting. Accepts paise (rounds defensively). */
export function formatPrice(pricePaise: number, currency: string = INR_CURRENCY): string {
  const paise = Math.round(pricePaise);
  return new Intl.NumberFormat(IN_LOCALE, {
    style: "currency",
    currency,
  }).format(paise / 100);
}

/** Admin form input (₹, may be fractional) → canonical paise integer. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Canonical paise → admin form / legacy display value in ₹. */
export function paiseToRupees(pricePaise: number): number {
  return Math.round(pricePaise) / 100;
}

/** Legacy float-₹ rows (pre-migration) → paise. */
export function legacyRupeesToPaise(priceRupees: unknown): number {
  const n = Number(priceRupees);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
