import "dotenv/config"; // load server/.env BEFORE any config access
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { createOrder, verifyPayment } from "./orders.js";
import { razorpayWebhook } from "./webhooks.js";
import { fulfill, shippingQuote, shiprocketWebhook, getShiprocketStatus } from "./shiprocket.js";
import { refundOrder } from "./refunds.js";

const app = express();

// Behind a single reverse proxy (cloudflared tunnel) — lets express-rate-limit
// see the real client IP via X-Forwarded-For instead of erroring/warning and
// keying everyone as the same user.
app.set("trust proxy", 1);

// Minimal security headers (no extra dependency for three headers).
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// CORS: Allow storefronts, admin panel, preview deployments, and localhost.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.timberteak.com",
  "https://timberteak.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const isAllowed =
        DEFAULT_ALLOWED_ORIGINS.includes(origin) ||
        config.allowedOrigins.includes(origin) ||
        origin.endsWith(".timberteak.com") ||
        origin.endsWith(".vercel.app");
      if (isAllowed) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    credentials: true,
  })
);

app.get("/healthz", (_, res) => res.json({ ok: true }));

// Webhook FIRST with a raw-body parser — express.json() must never touch it,
// or signature verification breaks.
app.post("/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), razorpayWebhook);

// Carrier webhooks have no signatures; the raw body is parsed later and
// needs no JSON middleware — parse inside the handler (body as Buffer).
// Path deliberately avoids the words Shiprocket forbids in webhook URLs
// (shiprocket/sr/kr/kartrocket): it's just the courier provider callback.
app.post("/webhooks/carrier", express.raw({ type: "application/json", limit: "512kb" }), shiprocketWebhook);
// Health-probes from merchant panels (GET/HEAD) must answer 200, else the
// panel refuses to save the webhook ("unable to send request …").
app.get(["/webhooks/carrier", "/health"], (_, res) => res.json({ ok: true }));

app.use(express.json({ limit: "100kb" }));

const paymentLimiter = rateLimit({
  windowMs: 60_000,
  max: 30, // 30 payment ops / minute / IP — generous for humans, cheap for abuse
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.post("/create-order", paymentLimiter, createOrder);
app.post("/verify-payment", paymentLimiter, verifyPayment);
app.post("/shipping/quote", paymentLimiter, shippingQuote);
app.get("/shipping/status", getShiprocketStatus);
app.post("/fulfill", paymentLimiter, fulfill);
app.post("/refund", paymentLimiter, refundOrder);

// JSON error envelope (returns clear error message without leaking secrets).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error("[payment-server error]:", err);
  res.status(status).json({ error: err.message || "Internal error." });
});

app.listen(config.port, () => {
  console.log(`[vm] payment server listening on :${config.port} (test mode: ${config.razorpayKeyId.startsWith("rzp_test_")})`);
});
