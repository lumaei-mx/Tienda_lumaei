import type { Market, Product, PublicProduct, StoreSettings } from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * PRECIO DE TIENDA — SIEMPRE en dólares (la conversión a MXN la hace el banco
 * del cliente al momento del pago; el comprobante llega en pesos).
 * Ejemplo ES: "$13.99 dlls" · EN: "$13.99 USD"
 */
export function formatPrice(amount: number, lang: Lang = "es"): string {
  const base = formatMoney(amount);
  return `${base} ${t("priceUsdSuffix", lang)}`;
}

export function productPrice(product: Pick<PublicProduct, "priceUsd">) {
  return product.priceUsd;
}

/** Convierte USD a MXN con el tipo de cambio configurado. */
export function toMxn(usd: number, rate = 17.5): number {
  return Number((usd * rate).toFixed(2));
}

/** Formatea en pesos mexicanos. */
export function formatMoneyMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formatea un monto USD según el mercado: MXN para México, USD para US.
 *  El rate debe ser settings.usdToMxn (no el default 17.5) para que el
 *  display coincida con lo que Stripe cobra en MXN. */
export function formatByMarket(
  usd: number,
  market: "MX" | "US",
  rate?: number
): string {
  return market === "MX" ? formatMoneyMxn(toMxn(usd, rate)) : formatMoney(usd);
}

export function calcShipping(
  s: StoreSettings,
  subtotal: number,
  market: Market
) {
  if (market === "MX") {
    return subtotal >= s.freeShippingMxUsd ? 0 : s.shippingFlatMxUsd;
  }
  return subtotal >= s.freeShippingUsd ? 0 : s.shippingFlatUsd;
}

export function calcTax(
  s: StoreSettings,
  subtotal: number,
  shipping: number,
  market: Market
) {
  const rate = market === "MX" ? s.taxRateMx : s.taxRateUs;
  return Number(((subtotal + shipping) * rate).toFixed(2));
}

export function marginForProduct(
  s: StoreSettings,
  product: Product,
  market: Market
) {
  const priceUsd = product.priceUsd;
  const ship = market === "MX" ? product.shippingMxUsd : product.shippingUsUsd;
  const cogs = product.costUsd + ship;
  const fee = priceUsd * s.paymentFeeRate;
  const profit = priceUsd - cogs - fee;
  const marginPct = priceUsd > 0 ? (profit / priceUsd) * 100 : 0;
  return {
    priceUsd,
    cogs,
    fee,
    profit,
    marginPct: Number(marginPct.toFixed(1)),
  };
}
