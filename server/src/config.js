// Central VM configuration. Fails loudly at boot when required secrets are
// missing — a payment server must never run half-configured.
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[vm] Missing required env var ${name}. See server/.env.example.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  currency: process.env.CURRENCY ?? "INR",
  allowedOrigins: (process.env.ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  razorpayKeyId: required("RAZORPAY_KEY_ID"),
  razorpayKeySecret: required("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: required("RAZORPAY_WEBHOOK_SECRET"),
  firebaseDatabaseURL: required("FIREBASE_DATABASE_URL"),
  // Shiprocket (semi-auto fulfillment). Optional at boot — /fulfill and
  // /shipping/quote answer 503 with a clear message until these are set.
  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL ?? "",
    password: process.env.SHIPROCKET_PASSWORD ?? "",
    // Optional pickup location NAME configured in the Shiprocket panel;
    // empty = the account's default/"Primary" location.
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION ?? "",
    // Optional pickup pincode sent to /v1/courier/serviceability. Empty = omit.
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE ?? "",
    // Shiprocket webhooks cannot be signed; they DO support HTTP Basic auth.
    // Format "user:pass" — webhook auth is enforced ONLY when this is set.
    webhookBasic: process.env.SHIPROCKET_WEBHOOK_BASIC ?? "",
    // Fallback parcel weight (grams) for products missing `weightGrams`.
    // 0 = do not guess; /fulfill fails with a fix-it message instead.
    defaultWeightGrams: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_G ?? 0),
  },
};
