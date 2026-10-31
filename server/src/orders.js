import crypto from "node:crypto";
import Razorpay from "razorpay";
import { config } from "./config.js";
import { db, auth } from "./firebase.js";

export const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret,
});

export const MAX_QTY_PER_LINE = 10;
const MAX_LINES = 50;

/** Bearer <Firebase ID token> → uid. Anonymous auth accepted (guest checkout). */
export async function requireUserId(req) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    const err = new Error("Missing Authorization bearer token.");
    err.status = 401;
    throw err;
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    const err = new Error("Invalid auth token.");
    err.status = 401;
    throw err;
  }
}

function validateItems(body) {
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) {
    const err = new Error(`items must be an array of 1–${MAX_LINES} lines.`);
    err.status = 400;
    throw err;
  }
  return items.map((line, i) => {
    const id = typeof line?.id === "string" ? line.id.trim() : "";
    const qty = Number(line?.qty);
    if (!id || id.length > 200 || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      const err = new Error(`items[${i}]: need {id: string, qty: int 1–${MAX_QTY_PER_LINE}}.`);
      err.status = 400;
      throw err;
    }
    return { id, qty };
  });
}

/**
 * POST /create-order — body {items:[{id,qty}], customer, address} ONLY.
 * Prices are re-read from RTDB with the Admin SDK and the total is computed
 * here. The client amount is NEVER trusted. Customer + address are validated
 * on the VM (never trust the browser) and snapshotted onto the order so
 * fulfillment has everything it needs even if the client changes later.
 */
export async function createOrder(req, res, next) {
  try {
    const userId = await requireUserId(req);
    const lines = validateItems(req.body);
    const customer = validateCustomer(req.body?.customer);
    const address = validateAddress(req.body?.address);

    const snap = await db.ref("projects").get();
    const catalog = snap.val() ?? {};

    let amountPaise = 0;
    const orderItems = [];
    for (const { id, qty } of lines) {
      const row = catalog[id];
      const pricePaise = Number(row?.pricePaise);
      const name = typeof row?.name === "string" ? row.name : typeof row?.title === "string" ? row.title : "";
      if (row == null || row.isActive === false || !name || !Number.isInteger(pricePaise) || pricePaise < 0) {
        const err = new Error(`Item ${id} is unavailable.`);
        err.status = 400;
        throw err;
      }
      const stock = row.stock;
      if (stock !== undefined && stock !== null && stock !== "" && qty > Number(stock)) {
        const err = new Error(`Only ${stock} unit(s) of "${name}" available.`);
        err.status = 400;
        throw err;
      }
      amountPaise += pricePaise * qty; // integer math only
      orderItems.push({
        id,
        name,
        qty,
        pricePaise,
        // Parcel specs for Shiprocket — snapshotted from the catalog at
        // order time so later catalog edits never mutate a paid order.
        weightGrams: row.weightGrams == null ? null : Number(row.weightGrams),
        lengthCm: row.lengthCm == null ? null : Number(row.lengthCm),
        widthCm: row.widthCm == null ? null : Number(row.widthCm),
        heightCm: row.heightCm == null ? null : Number(row.heightCm),
      });
    }
    if (amountPaise < 100) {
      // Razorpay minimum is ₹1.00.
      const err = new Error("Order total is below the ₹1.00 minimum.");
      err.status = 400;
      throw err;
    }

    const rzOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: config.currency,
      receipt: `tmb_${Date.now().toString(36)}`,
    });

    const now = Date.now();
    await db.ref(`orders/${rzOrder.id}`).set({
      id: rzOrder.id,
      receipt: rzOrder.receipt,
      status: "pending", // → paid → processing → shipped → out_for_delivery → delivered (failed/refunded/rto wrong-way states)
      items: orderItems,
      amountPaise,
      currency: config.currency,
      customer,
      address,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    res.json({
      orderId: rzOrder.id,
      amount: amountPaise,
      currency: config.currency,
      keyId: config.razorpayKeyId, // public key only — safe to expose
    });
  } catch (err) {
    next(err);
  }
}

function requireText(obj, key, min, max, label) {
  const value = typeof obj?.[key] === "string" ? obj[key].trim() : "";
  if (value.length < min || value.length > max) {
    const err = new Error(`${label}: need ${min}–${max} characters.`);
    err.status = 400;
    throw err;
  }
  return value;
}

function optionalText(obj, key, max, label) {
  const value = typeof obj?.[key] === "string" ? obj[key].trim() : "";
  if (value.length > max) {
    const err = new Error(`${label}: max ${max} characters.`);
    err.status = 400;
    throw err;
  }
  return value;
}

/**
 * customer: {name, email?, phone} — guest checkout supported; email is
 * optional but recommended (Shiprocket uses it for delivery updates).
 */
export function validateCustomer(input) {
  return {
    name: requireText(input, "name", 2, 80, "Customer name"),
    email: optionalText(input, "email", 254, "Email"),
    phone: (() => {
      const raw = requireText(input, "phone", 10, 15, "Phone");
      const digits = raw.replace(/[^\d]/g, "");
      if (!/^(\d{10}|\d{12}|\d{11,13})$/.test(digits)) {
        const err = new Error("Phone: 10-digit Indian number (or E.164 dial code).");
        err.status = 400;
        throw err;
      }
      // Keep the last 10 digits — the VM never needs the +91 prefix.
      return digits.slice(-10);
    })(),
  };
}

/** address: Indian residential address — everything Shiprocket needs. */
export function validateAddress(input) {
  return {
    line1: requireText(input, "line1", 3, 200, "Address line 1"),
    line2: optionalText(input, "line2", 100, "Address line 2"),
    city: requireText(input, "city", 2, 80, "City"),
    state: requireText(input, "state", 2, 80, "State"),
    pincode: ((v) => {
      if (!/^[1-9]\d{5}$/.test(v)) {
        const err = new Error("Pincode: 6 digits, first not 0.");
        err.status = 400;
        throw err;
      }
      return v;
    })(requireText(input, "pincode", 6, 6, "Pincode")),
  };
}
/** Admin-gate: like requireUserId, but the token must carry admin:true. */
export async function requireAdmin(req) {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) {
    const err = new Error("Missing Authorization bearer token.");
    err.status = 401;
    throw err;
  }
  try {
    const decoded = await auth.verifyIdToken(header.slice(7));
    if (decoded.admin !== true) {
      const err = new Error("Admin only.");
      err.status = 403;
      throw err;
    }
    return decoded.uid;
  } catch (err) {
    if (err.status === 403) throw err;
    const e = new Error("Invalid auth token.");
    e.status = 401;
    throw e;
  }
}

/**
 * Transition an order to paid exactly once. Returns true when THIS caller
 * performed the transition (and may therefore decrement stock).
 */
export async function markOrderPaid(orderId, paymentId) {
  const orderRef = db.ref(`orders/${orderId}`);
  const result = await orderRef.transaction((order) => {
    if (!order) return order; // unknown order — abort
    if (order.status === "paid" || order.status === "refunded") return; // abort: already terminal
    order.status = "paid";
    order.razorpayPaymentId = paymentId;
    order.updatedAt = Date.now();
    return order;
  });
  if (!result.committed) return false;

  // Decrement tracked stock (untracked/null stock is skipped).
  const order = result.snapshot.val();
  for (const item of order.items ?? []) {
    const stockRef = db.ref(`projects/${item.id}/stock`);
    await stockRef.transaction((stock) => {
      if (stock === null || stock === undefined || stock === "") return; // untracked — abort
      return Math.max(0, Number(stock) - Number(item.qty));
    });
  }
  return true;
}

/**
 * POST /verify-payment — body {razorpay_order_id, razorpay_payment_id,
 * razorpay_signature}. HMAC-SHA256 over "order_id|payment_id" with the
 * KEY SECRET, compared timing-safe. Then the payment is re-fetched from
 * Razorpay so a forged "captured" claim can't mark an order paid.
 */
export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body ?? {};
    if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
      const err = new Error("Missing razorpay_order_id / razorpay_payment_id / razorpay_signature.");
      err.status = 400;
      throw err;
    }

    const expected = crypto
      .createHmac("sha256", config.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      const err = new Error("Invalid payment signature.");
      err.status = 400;
      throw err;
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) {
      const err = new Error("Payment does not belong to this order.");
      err.status = 400;
      throw err;
    }
    if (payment.status === "captured") {
      await markOrderPaid(orderId, paymentId);
      return res.json({ status: "paid", orderId, paymentId });
    }
    if (payment.status === "failed") {
      await db.ref(`orders/${orderId}`).update({ status: "failed", updatedAt: Date.now() });
      return res.json({ status: "failed", orderId, paymentId });
    }
    return res.json({ status: payment.status, orderId, paymentId });
  } catch (err) {
    next(err);
  }
}
