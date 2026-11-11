import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistProduct {
  id: string;
  name: string;
  pricePaise: number;
  image: string;
  category: string;
  type?: string;
  slug?: string;
}

interface WishlistState {
  items: WishlistProduct[];
  add: (product: WishlistProduct) => void;
  remove: (id: string) => void;
  toggle: (product: WishlistProduct) => void;
  has: (id: string) => boolean;
  clear: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product) =>
        set((state) => {
          if (state.items.some((item) => item.id === product.id)) return state;
          return { items: [...state.items, product] };
        }),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      toggle: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          get().remove(product.id);
        } else {
          get().add(product);
        }
      },
      has: (id) => get().items.some((item) => item.id === id),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
    }),
    {
      name: "timber-wishlist",
      skipHydration: true,
    }
  )
);

