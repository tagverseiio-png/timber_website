import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  /** CatalogProduct.id (RTDB key). Prices are ALWAYS resolved live from the catalog. */
  id: string;
  qty: number;
}

export const MAX_QTY_PER_LINE = 10;

interface CartState {
  lines: CartLine[];
  /** Add (or top up) a line. Caps at MAX_QTY_PER_LINE and at tracked stock. */
  add: (id: string, qty?: number, stock?: number | null) => void;
  setQty: (id: string, qty: number, stock?: number | null) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: () => number;
}

function cap(qty: number, stock?: number | null): number {
  const hardCap = stock == null ? MAX_QTY_PER_LINE : Math.min(MAX_QTY_PER_LINE, Math.max(stock, 0));
  return Math.max(0, Math.min(Math.floor(qty), hardCap));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (id, qty = 1, stock = null) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === id);
          const nextQty = cap((existing?.qty ?? 0) + qty, stock);
          if (nextQty <= 0) return { lines: s.lines.filter((l) => l.id !== id) };
          return {
            lines: existing
              ? s.lines.map((l) => (l.id === id ? { ...l, qty: nextQty } : l))
              : [...s.lines, { id, qty: nextQty }],
          };
        }),
      setQty: (id, qty, stock = null) =>
        set((s) => {
          const nextQty = cap(qty, stock);
          if (nextQty <= 0) return { lines: s.lines.filter((l) => l.id !== id) };
          return { lines: s.lines.map((l) => (l.id === id ? { ...l, qty: nextQty } : l)) };
        }),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
    }),
    { name: "timber-cart" } // localStorage persistence; totals stay derived, never stored
  )
);
