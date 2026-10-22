import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { createOrder, verifyPayment } from "./orders.js";
import { razorpayWebhook } from "./webhooks.js";

const app = express();

// Minimal security headers (no extra dependency for three headers).
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// CORS: the Vercel storefront only. Requests without Origin (curl/SSR) pass.
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed."));
    },
    methods: ["GET", "POST"],
  })
);

app.get("/healthz", (_, res) => res.json({ ok: true }));

// Webhook FIRST with a raw-body parser — express.json() must never touch it,
// or signature verification breaks.
app.post("/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), razorpayWebhook);

app.use(express.json({ limit: "100kb" }));

const paymentLimiter = rateLimit({
  windowMs: 60_000,
  max: 30, // 30 payment ops / minute / IP — generous for humans, cheap for abuse
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.post("/create-order", paymentLimiter, createOrder);
app.post("/verify-payment", paymentLimiter, verifyPayment);

// JSON error envelope (never leaks stack traces or secrets).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "Internal error." : err.message });
});

app.listen(config.port, () => {
  console.log(`[vm] payment server listening on :${config.port} (test mode: ${config.razorpayKeyId.startsWith("rzp_test_")})`);
});
