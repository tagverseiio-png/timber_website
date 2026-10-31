import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./firebase.js";
import { requireAdmin } from "./orders.js";

/**
 * Shiprocket integration — SEMI-AUTO fulfillment.
 *
 * Pipeline: Razorpay webhook marks the order `paid` → an ADMIN reviews it and
 * calls POST /fulfill {orderId} → the VM creates the shipment on Shiprocket →
 * Phoneix webhooks drive status updates forward. Shiprocket cannot sign its
 * webhook payloads, so authentication uses HTTP Basic (admin panel setting)
 * when SHIPROCKET_WEBHOOK_BASIC is configured, plus schema sanity checks,
 * idempotency keys and cross-checks against known orders.
 */

const BASE = "https://apiv2.shiprocket.in/v1";
const AUTH_URL = "https://apiv2.shiprocket.in/v1/authentications";
// Token is valid ~10 days; refresh after 8 to leave a safety margin.
const TOKEN_TTL_MS = 8 * 24 * 60 * 60 * 1000;

let tokenCache = { token: "", fetchedAt: 0 };

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function needShiprocketConfig() {
  const c = config.shiprocket;
  if (!c.email || !c.password) {
    throw new HttpError(
      503,
      "Shiprocket is not configured on the VM (set SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD)."
    );
  }
  return c;
}

async function refreshShiprocketToken() {
  const c = needShiprocketConfig();
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: c.email, password: c.password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.token !== "string" || !data.token) {
    console.error("[shiprocket] auth failed:", res.status, data);
    throw new HttpError(502, "Shiprocket authentication failed.");
  }
  tokenCache = { token: data.token, fetchedAt: Date.now() };
  return data.token;
}

async function shiprocketToken() {
  if (tokenCache.token && Date.now() - tokenCache.fetchedAt < TOKEN_TTL_MS) {
    return tokenCache.token;
  }
  return refreshShiprocketToken();
}

async function srRequest(path, body, { retryOn401 = true } = {}) {
  const token = await shiprocketToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401 && retryOn401) {
    tokenCache = { token: "", fetchedAt: 0 };
    return srRequest(path, body, { retryOn401: false });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[shiprocket] ${path} ${res.status}:`, JSON.stringify(data).slice(0, 500));
    throw new HttpError(502, `Shiprocket request failed (${res.status}).`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Parcel specs: total weight = Σ units × item weight; dims = largest item.
// A missing weight is a hard error (courier pricing depends on it).
// ---------------------------------------------------------------------------
function parcelSpec(items) {
  let grams = 0;
  let L = 0;
  let W = 0;
  let H = 0;
  let missing = [];
  for (const item of items) {
    const w =
      Number.isFinite(item.weightGrams) && item.weightGrams > 0
        ? item.weightGrams
        : config.shiprocket.defaultWeightGrams > 0
          ? config.shiprocket.defaultWeightGrams
          : null;
    if (w == null) missing.push(item.name);
    grams += (w ?? 0) * Number(item.qty);
    L = Math.max(L, item.lengthCm ?? 0);
    W = Math.max(W, item.widthCm ?? 0);
    H = Math.max(H, item.heightCm ?? 0);
  }
  if (missing.length) {
    throw new HttpError(
      400,
      `Add weightGrams (grams) for: ${missing.join(", ")}. ` +
        "Edit the product, set SHIPROCKET_DEFAULT_WEIGHT_G, then retry."
    );
  }
  return {
    weight: Math.max(1, Math.round(grams)),
    ...(L || W || H ? { length: Math.max(1, L), width: Math.max(1, W), height: Math.max(1, H) } : {}),
  };
}

/** dd/mm/yyyy — the format Shiprocket's create-order API accepts. */
function shiprocketDate(ms) {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * POST /fulfill {orderId} — admin action ("Approve & Ship").
 * Creates the Shiprocket order for a PAID order and assigns an AWB.
 * Idempotent: rerunning returns the existing shipment data unchanged.
 */
export async function fulfill(req, res, next) {
  try {
    const adminUid = await requireAdmin(req);
    const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : "";
    if (!orderId || orderId.length > 100) {
      throw new HttpError(400, "orderId is required.");
    }

    const snap = await db.ref(`orders/${orderId}`).get();
    const order = snap.val();
    if (!order) throw new HttpError(404, "Order not found.");

    if (order.shiprocket?.orderId && (order.status === "processing" || order.status === "shipped")) {
      return res.json({ ok: true, already: true, shiprocket: order.shiprocket });
    }
    if (order.status !== "paid") {
      throw new HttpError(409, `Order status is "${order.status}" — only paid orders can be shipped.`);
    }

    const sr = parcelSpec(order.items ?? []);
    const c = config.shiprocket;

    const payload = {
      order_number: orderId, // match on Razorpay order id — unique, end-to-end traceable
      order_date: shiprocketDate(order.createdAt ?? Date.now()),
      ...(c.pickupLocation ? { pickup_location: c.pickupLocation } : {}),
      billing_customer_name: order.customer?.name ?? "",
      billing_firstname: (order.customer?.name ?? "").split(" ")[0],
      billing_lastname: (order.customer?.name ?? "").split(" ").slice(1).join(" "),
      billing_address: order.address?.line1 ?? "",
      billing_address_2: order.address?.line2 ?? "",
      billing_city: order.address?.city ?? "",
      billing_pincode: order.address?.pincode ?? "",
      billing_state: order.address?.state ?? "",
      billing_country: "India",
      billing_phone: order.customer?.phone ?? "",
      billing_email: order.customer?.email ?? "",
      shipping_is_billing: true,
      order_items: (order.items ?? []).map((item) => ({
        name: item.name,
        sku: item.id,
        units: Number(item.qty),
        selling_price: Number(item.pricePaise) / 100,
      })),
      payment_method: "Prepaid", // Razorpay = always prepaid
      sub_total: Number(order.amountPaise) / 100,
      weight: sr.weight,
      ...(sr.length ? { length: sr.length, width: sr.width, height: sr.height } : {}),
    };

    const created = await srRequest("/orders", payload);
    // Shiprocket v1 create-order → { order_id, shipment_id }
    const shipmentId =
      (Array.isArray(created.insert_data) ? created.insert_data[0]?.shipment_id : undefined) ??
      created.shipment_id ??
      "";
    const shiprocketInfo = {
      orderId: String(created.order_id ?? ""),
      shipmentId: String(shipmentId ?? ""),
      awb: "", // filled by assign-awb below (or the webhook later)
      courierName: "",
      state: "created", // created | picked_up | in_transit | out_for_delivery | delivered | undelivered | rto
      createdAt: Date.now(),
      by: adminUid,
    };

    // Assign AWB when we have a shipment id — non-fatal, the webhook fills it in later.
    if (shiprocketInfo.shipmentId) {
      try {
        const awb = await srRequest("/orders/assign/awb", { shipment_id: shiprocketInfo.shipmentId });
        shiprocketInfo.awb = String(awb.data?.awb_number ?? awb.awb_number ?? "");
        shiprocketInfo.courierName = String(awb.data?.courier_name ?? awb.courier_name ?? "");
      } catch (err) {
        console.warn("[shiprocket] assign-awb deferred to webhook:", err.message);
      }
    }

    await db.ref(`orders/${orderId}`).update({
      status: "processing",
      shiprocket: shiprocketInfo,
      updatedAt: Date.now(),
    });

    res.json({ ok: true, already: false, awb: shiprocketInfo.awb, courier: shiprocketInfo.courierName });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /shipping/quote {pincode} — public pre-payment check from the
 * storefront: is the destination serviceable (prepaid) and what's the ETA?
 */
export async function shippingQuote(req, res, next) {
  try {
    const pincode = typeof req.body?.pincode === "string" ? req.body.pincode.replace(/\D/g, "") : "";
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      throw new HttpError(400, "pincode: 6 digits, first not 0.");
    }
    const c = needShiprocketConfig();

    const body = { postcode: pincode, cod: "0" }; // cod:0 = prepaid serviceability
    if (/^[1-9]\d{5}$/.test(c.pickupPincode)) body.pickup_postcode = c.pickupPincode;
    else body.default = "1";

    const data = await srRequest("/courier/serviceability", body);
    const couriers = (data?.data?.available_courier_companies ?? []).map((co) => ({
      name: co.courier_name,
      etaDate: co.estimated_delivery_date ?? "",
      rate: Number(co.rate ?? 0),
    }));
    res.json({ serviceable: couriers.length > 0, couriers });
  } catch (err) {
    next(err);
  }
}

/**
 * Best-effort shipment cancel (used when refunding an order that was already
 * handed to Shiprocket). Non-throwing: refund must never fail because the
 * carrier cancel did — the webhook/RTO flow handles whatever remains.
 */
export async function cancelShipment(shipmentId) {
  if (!shipmentId) return null;
  try {
    return await srRequest(`/orders/cancel/shipment/${encodeURIComponent(shipmentId)}`, {});
  } catch (err) {
    console.warn(`[shiprocket] cancel shipment ${shipmentId} failed (non-fatal):`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Webhook: POST /webhooks/shiprocket
// No cryptographic signature exists. Defense in depth:
//   1. HTTP Basic auth (enforced when SHIPROCKET_WEBHOOK_BASIC is set)
//   2. Only orders we know about in RTDB are touched
//   3. Idempotency key (event id, or SHA-256 of the body) in /webhookEvents
//   4. Status mapping is keyword-based on known Shiprocket status strings
// ---------------------------------------------------------------------------
const STATUS_MAP = [
  { state: "delivered", order: "delivered", words: ["delivered"] },
  { state: "out_for_delivery", order: "shipped", words: ["out for delivery"] },
  { state: "picked_up", order: "shipped", words: ["picked up", "picked", "pickup delayed"] },
  { state: "in_transit", order: "shipped", words: ["in transit", "shipped", "dispatched", "generated", "scheduled", "unawbed"] },
  { state: "undelivered", order: "rto", words: ["undelivered"] },
  { state: "rto", order: "rto", words: ["rto", "lost", "damaged"] },
];

function classify(payload) {
  const text = JSON.stringify(payload).toLowerCase();
  // Order matters: "out for delivery" beats "in transit"; "delivered without a negation".
  for (const m of STATUS_MAP) {
    for (const w of m.words) {
      if (text.includes(w)) {
        if (!(m.state === "delivered" && (text.includes("undelivered") || text.includes("not delivered")))) {
          return m;
        }
      }
    }
  }
  return null;
}

/** Recursively find the first string value of a key (Shiprocket payloads vary). */
function findDeep(obj, key) {
  if (obj == null || typeof obj !== "object") return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const found = findDeep(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function basicAuthOk(req, expected) {
  const header = req.headers.authorization ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const a = Buffer.from(decoded);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function shiprocketWebhook(req, res, next) {
  try {
    const c = config.shiprocket;
    if (c.webhookBasic && !basicAuthOk(req, c.webhookBasic)) {
      return res.status(401).json({ error: "Bad webhook credentials." });
    }

    const payload = JSON.parse(req.body.toString("utf8"));
    const match = classify(payload);
    if (!match) return res.json({ ok: true, ignored: true }); // unknown/irrelevant event

    const eventKeyRaw =
      findDeep(payload, "event_id") ??
      findDeep(payload, "id") ??
      crypto.createHash("sha256").update(req.body).digest("hex");
    const eventKey = typeof eventKeyRaw === "string" || typeof eventKeyRaw === "number"
      ? `sr_${eventKeyRaw}`
      : null;
    const eventText = payload?.event ?? match.state;

    const orderNumber = [
      findDeep(payload, "order_number"),
      findDeep(payload, "order_id"),
    ]
      .map(String)
      .find((v) => /^order_[A-Za-z0-9]{10,}$/.test(v) || v.length > 6);
    if (!orderNumber) {
      return res.json({ ok: true, ignored: true });
    }

    // Dedupe inside a transaction (same pattern as the Razorpay webhook).
    const dedupeKey = `${eventKey ?? `sr_${crypto.createHash("sha256").update(req.body).digest("hex")}`}`;
    const claim = await db.ref(`webhookEvents/${dedupeKey}`).transaction((cur) => {
      if (cur !== null) return;
      return { receivedAt: Date.now(), event: String(eventText) };
    });
    if (!claim.committed) return res.json({ ok: true, deduped: true });

    // Cross-check: only mutate orders that exist in /orders.
    const orderRef = db.ref(`orders/${orderNumber}`);
    const snap = await orderRef.get();
    if (!snap.exists()) {
      return res.json({ ok: true, ignored: "unknown order" });
    }

    const patch = {
      status: match.order,
      updatedAt: Date.now(),
      "shiprocket/state": match.state,
    };
    const awb = findDeep(payload, "awb") ?? findDeep(payload, "awb_code") ?? findDeep(payload, "courier_awb");
    if (typeof awb === "string" && awb) patch["shiprocket/awb"] = awb;
    const courier = findDeep(payload, "courier_name");
    if (typeof courier === "string" && courier && !patch["shiprocket/courierName"]) {
      patch["shiprocket/courierName"] = courier;
    }
    await orderRef.update(patch);

    // Append a timeline entry for admin visibility (audit trail).
    await db.ref(`orders/${orderNumber}/shippingTimeline`).push({
      state: match.state,
      status: match.order,
      awb: patch["shiprocket/awb"] ?? "",
      event: String(eventText),
      receivedAt: Date.now(),
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
