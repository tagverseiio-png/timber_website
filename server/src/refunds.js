import { config } from "./config.js";
import { db } from "./firebase.js";
import { razorpay, requireAdmin } from "./orders.js";
import { cancelShipment } from "./shiprocket.js";

/**
 * POST /refund {orderId} — admin action. Full refund of the original
 * payment, idempotent, and best-effort cancels any in-flight Shiprocket
 * shipment first (never the other way around: money correctness comes
 * before carrier cleanup, and the webhook flow cleans up the rest).
 */
export async function refundOrder(req, res, next) {
  try {
    const adminUid = await requireAdmin(req);
    const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : "";
    if (!orderId || orderId.length > 100) {
      const err = new Error("orderId is required.");
      err.status = 400;
      throw err;
    }

    const snap = await db.ref(`orders/${orderId}`).get();
    const order = snap.val();
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }
    if (order.status === "refunded") {
      // Idempotent: an admin double-click (or two admins together) is a no-op.
      return res.json({ ok: true, already: true, refundId: order.refund?.id ?? "" });
    }
    if (!["paid", "processing", "shipped", "out_for_delivery", "rto"].includes(order.status)) {
      const err = new Error(`Order status is "${order.status}" — it cannot be refunded.`);
      err.status = 409;
      throw err;
    }
    if (!order.razorpayPaymentId) {
      const err = new Error("Order has no recorded payment id.");
      err.status = 409;
      throw err;
    }

    // Carrier first: stop the parcel before the money moves back, when we can.
    if (order.shiprocket?.shipmentId && order.status !== "delivered") {
      await cancelShipment(order.shiprocket.shipmentId);
    }

    let refund;
    try {
      refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: order.amountPaise, // full refund, integer paise
        speed: "normal",
        notes: { orderId, by: adminUid },
      });
    } catch (err) {
      // Razorpay rejects double-refunds with a 4xx — surface it, but map an
      // "already refunded" payment to idempotent success.
      const msg = String(err?.error?.description ?? err?.message ?? "");
      if (/already been refunded/i.test(msg)) {
        await db.ref(`orders/${orderId}`).update({ status: "refunded", updatedAt: Date.now() });
        return res.json({ ok: true, already: true });
      }
      err.status = 502;
      err.message = `Razorpay refund failed: ${msg || "unknown error"}`;
      throw err;
    }

    await db.ref(`orders/${orderId}`).update({
      status: "refunded",
      refund: {
        id: refund.id ?? "",
        amount: refund.amount ?? order.amountPaise,
        createdAt: Date.now(),
        by: adminUid,
        currency: config.currency,
      },
      updatedAt: Date.now(),
    });

    // Timeline entry keeps the audit trail consistent with webhook-driven states.
    await db.ref(`orders/${orderId}/shippingTimeline`).push({
      state: "refund_requested",
      status: "refunded",
      event: "refund.created",
      refundId: refund.id ?? "",
      receivedAt: Date.now(),
    });

    return res.json({ ok: true, refundId: refund.id ?? "" });
  } catch (err) {
    next(err);
  }
}
