import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./firebase.js";
import { markOrderPaid } from "./orders.js";

/**
 * POST /webhooks/razorpay — the SOURCE OF TRUTH for final order status.
 * Mounted with express.raw() so verification runs over the RAW body bytes.
 * Idempotent: each Razorpay event id is recorded under /webhookEvents and
 * duplicates are acknowledged without re-processing.
 */
export async function razorpayWebhook(req, res, next) {
  try {
    const received = req.headers["x-razorpay-signature"];
    if (typeof received !== "string" || !Buffer.byteLength(received, "hex")) {
      return res.status(400).json({ error: "Missing X-Razorpay-Signature." });
    }
    const expected = crypto
      .createHmac("sha256", config.razorpayWebhookSecret)
      .update(req.body) // raw Buffer — never JSON-parsed before this point
      .digest("hex");

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: "Invalid webhook signature." });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const eventId = event?.id;
    const type = event?.event;
    if (typeof eventId !== "string" || typeof type !== "string") {
      return res.status(400).json({ error: "Malformed webhook payload." });
    }

    // Idempotency gate: first delivery wins.
    const claim = await db.ref(`webhookEvents/${eventId}`).transaction((cur) => {
      if (cur !== null) return; // abort — duplicate
      return { receivedAt: Date.now(), event: type };
    });
    if (!claim.committed) return res.json({ ok: true, deduped: true });

    const entity = event?.payload?.payment?.entity ?? event?.payload?.order?.entity ?? {};
    const orderId = entity.order_id ?? entity.id;

    switch (type) {
      case "payment.captured":
      case "order.paid":
        if (orderId) await markOrderPaid(orderId, entity.id ?? entity.payment_id);
        break;
      case "payment.failed":
        if (orderId) {
          await db.ref(`orders/${orderId}`).update({ status: "failed", updatedAt: Date.now() });
        }
        break;
      case "refund.processed":
      case "refund.created":
        if (orderId) {
          await db.ref(`orders/${orderId}`).update({ status: "refunded", updatedAt: Date.now() });
        }
        break;
      default:
        break; // unknown events are stored (idempotency key) and ignored
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
