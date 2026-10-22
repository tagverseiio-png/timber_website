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
};
