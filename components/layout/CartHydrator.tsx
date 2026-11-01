"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";

/**
 * Rehydrates the persisted cart AFTER mount (skipHydration: true on the store
 * prevents synchronous rehydration at module init, which renders different
 * HTML on server vs client and causes React 19 hydration errors).
 */
export function CartHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
  return null;
}
