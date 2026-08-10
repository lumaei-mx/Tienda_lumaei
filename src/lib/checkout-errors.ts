import type { Lang } from "./i18n";

/**
 * Errores del flujo de compra con código estable → localizables en el cliente.
 * createPendingOrder lanza Error("CHECKOUT:<CODE>:<detalle>").
 */
const MESSAGES: Record<string, { es: string; en: string }> = {
  "CHECKOUT:PRODUCT_NOT_FOUND": {
    es: "Un producto del carrito ya no está disponible.",
    en: "A product in your cart is no longer available.",
  },
  "CHECKOUT:INSUFFICIENT_STOCK": {
    es: "Stock insuficiente para uno de los productos.",
    en: "Not enough stock for one of the products.",
  },
  "CHECKOUT:EMPTY_CART": {
    es: "Tu carrito está vacío.",
    en: "Your cart is empty.",
  },
};

export function throwCheckoutError(code: keyof typeof MESSAGES, detail?: string): never {
  throw new Error(`${code}${detail ? `:${detail}` : ""}`);
}

/** Traduce un error de checkout (o devuelve el mensaje tal cual si no es conocido). */
export function localizeCheckoutError(message: string, lang: Lang): string {
  for (const code of Object.keys(MESSAGES)) {
    if (message.startsWith(code)) return MESSAGES[code][lang];
  }
  return message;
}
