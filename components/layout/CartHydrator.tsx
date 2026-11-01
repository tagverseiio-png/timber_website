"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

/**
 * Rehydrates the persisted cart and wishlist AFTER mount (skipHydration: true
 * prevents synchronous rehydration at module init, which causes React 19 hydration errors).
 */
export function CartHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);
  return null;
}
