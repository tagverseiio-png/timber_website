import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { ref, get, set, update, serverTimestamp, onValue } from "firebase/database";
import { auth, database } from "@/lib/firebase";

export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt?: number;
  updatedAt?: number;
}

export interface CustomerOrder {
  id: string;
  receipt?: string;
  amountPaise: number;
  currency: string;
  status:
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "refunded"
    | "cancelled"
    | "out_of_stock"
    | string;
  createdAt: number;
  updatedAt?: number;
  adminNotes?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items?: Array<{
    id?: string;
    name: string;
    qty: number;
    pricePaise: number;
  }>;
  shiprocket?: {
    orderId?: number | string;
    shipmentId?: number | string;
    awb?: string;
    courier?: string;
    courierName?: string;
    trackingUrl?: string;
    tracking_url?: string;
    status?: string;
    state?: string;
  };
}

/**
 * Signs in or registers a customer via Google One-Click Authentication.
 * Automatically initializes or updates their profile in RTDB at /users/{uid}.
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Initialize or update profile in RTDB
  const userRef = ref(database, `users/${user.uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await set(userRef, {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email?.toLowerCase() || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Keep profile details synchronized
    await update(userRef, {
      name: user.displayName || snap.val()?.name || "",
      email: user.email?.toLowerCase() || snap.val()?.email || "",
      photoURL: user.photoURL || snap.val()?.photoURL || "",
      updatedAt: serverTimestamp(),
    });
  }

  return user;
}

/** Signs out the currently authenticated user. */
export async function signOutCustomer(): Promise<void> {
  await signOut(auth);
}

/** Fetches profile data for a customer from RTDB /users/{uid}. */
export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  try {
    const snap = await get(ref(database, `users/${uid}`));
    if (!snap.exists()) return null;
    return snap.val() as CustomerProfile;
  } catch {
    return null;
  }
}

/** Updates customer profile data in RTDB /users/{uid}. */
export async function updateCustomerProfile(
  uid: string,
  data: Partial<Omit<CustomerProfile, "uid" | "createdAt">>
): Promise<void> {
  if (data.name && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: data.name });
  }
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetches all orders belonging to this customer from RTDB.
 * Uses /userOrders/{uid} index to directly resolve individual /orders/{orderId}
 * records without requiring root-level /orders scan permissions.
 */
export async function getCustomerOrders(uid: string): Promise<CustomerOrder[]> {
  try {
    // 1. Check user-indexed order IDs
    const userOrdersSnap = await get(ref(database, `userOrders/${uid}`));
    if (userOrdersSnap.exists()) {
      const orderKeys = Object.keys(userOrdersSnap.val() as Record<string, unknown>);
      const orderPromises = orderKeys.map(async (key) => {
        try {
          const s = await get(ref(database, `orders/${key}`));
          if (s.exists()) {
            return { ...(s.val() as CustomerOrder), id: key };
          }
        } catch {
          // ignore
        }
        return null;
      });
      const resolved = (await Promise.all(orderPromises)).filter((o): o is CustomerOrder => o !== null);
      if (resolved.length > 0) {
        return resolved.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      }
    }

    // 2. Direct read if available
    const ordersSnap = await get(ref(database, "orders"));
    if (ordersSnap.exists()) {
      const allOrders = ordersSnap.val() as Record<string, CustomerOrder>;
      return Object.entries(allOrders)
        .map(([id, order]) => ({ ...order, id }))
        .filter((o) => (o as unknown as { userId?: string }).userId === uid)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    return [];
  }
}

/**
 * Real-time subscription to a customer's orders.
 * Automatically updates whenever an admin changes status, assigns AWB, or updates notes.
 */
export function subscribeToCustomerOrders(
  uid: string,
  onUpdate: (orders: CustomerOrder[]) => void
): () => void {
  const userOrdersRef = ref(database, `userOrders/${uid}`);
  const orderUnsubs: Record<string, () => void> = {};
  const ordersMap: Record<string, CustomerOrder> = {};

  const broadcast = () => {
    const list = Object.values(ordersMap).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    onUpdate(list);
  };

  const mainUnsub = onValue(
    userOrdersRef,
    (snap) => {
      if (!snap.exists()) {
        getCustomerOrders(uid).then(onUpdate);
        return;
      }
      const orderKeys = Object.keys(snap.val() as Record<string, unknown>);

      // Clean up unsubs for removed keys
      for (const key of Object.keys(orderUnsubs)) {
        if (!orderKeys.includes(key)) {
          orderUnsubs[key]();
          delete orderUnsubs[key];
          delete ordersMap[key];
        }
      }

      // Attach live listener for each order
      for (const key of orderKeys) {
        if (!orderUnsubs[key]) {
          const oRef = ref(database, `orders/${key}`);
          orderUnsubs[key] = onValue(
            oRef,
            (oSnap) => {
              if (oSnap.exists()) {
                ordersMap[key] = { ...(oSnap.val() as CustomerOrder), id: key };
              } else {
                delete ordersMap[key];
              }
              broadcast();
            },
            () => {
              // Ignore individual read errors
            }
          );
        }
      }
      broadcast();
    },
    (err) => {
      console.warn("Real-time orders subscription fallback:", err.message);
      getCustomerOrders(uid).then(onUpdate);
    }
  );

  return () => {
    mainUnsub();
    Object.values(orderUnsubs).forEach((u) => u());
  };
}
