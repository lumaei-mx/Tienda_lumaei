"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Market } from "./types";
import type { Lang } from "./i18n";

interface CartState {
  items: CartItem[];
  // Ref de afiliado capturado desde una PDP con `?ref=@handle`. Viaja con el
  // carrito hasta el POST /api/checkout y se persiste en la Order (comisión 15%).
  // Se resetea en clear() para no atribuir compras futuras con un ref viejo.
  ref: string | null;
  setRef: (ref: string | null) => void;
  // Idioma de la tienda (ES/EN) — el toggle del header cambia esto, NO la moneda.
  lang: Lang;
  setLang: (lang: Lang) => void;
  // market queda SOLO para lógica (envío/impuestos/promos por país destino),
  // ya no se expone como selector de moneda en la UI.
  market: Market;
  setMarket: (market: Market) => void;
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ref: null,
      setRef: (ref) => set({ ref }),
      // IMPORTANTE: inicia SIEMPRE en "es" para que el SSR (server store) y la
      // primera render del cliente coincidan (evita error de hidratación React
      // #418). LangHydrate ajusta el idioma real desde la cookie tras el mount.
      lang: "es",
      setLang: (lang) => {
        // Persistir también en cookie para que el server renderice páginas
        // estáticas (envios, terminos, etc.) en el idioma activo.
        if (typeof document !== "undefined") {
          document.cookie = `lumaei-lang=${lang};path=/;max-age=31536000;samesite=lax`;
        }
        set({ lang });
      },
      market: "MX",
      setMarket: (market) => {
        if (typeof document !== "undefined") {
          document.cookie = `lumaei-market=${market};path=/;max-age=31536000;samesite=lax`;
        }
        set({ market });
      },
      add: (productId, qty = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.productId === productId);
        if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
        else items.push({ productId, qty });
        set({ items });
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQty: (productId, qty) => {
        if (qty <= 0) {
          get().remove(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, qty } : i
          ),
        });
      },
      clear: () => set({ items: [], ref: null }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
    }),
    { name: "lumaei-cart", skipHydration: true }
  )
);
