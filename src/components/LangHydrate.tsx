"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { detectLang } from "@/lib/i18n";

/**
 * Rehidrata el store persistido (carrito + idioma) tras el mount.
 * El store inicia en "es" y con skipHydration para que SSR e hidratación
 * coincidan (sin error React #418); aquí se restaura el estado real y se
 * sincroniza el idioma desde la cookie.
 */
export function LangHydrate() {
  const setLang = useCart((s) => s.setLang);
  useEffect(() => {
    useCart.persist.rehydrate();
    setLang(detectLang());
  }, [setLang]);
  return null;
}
