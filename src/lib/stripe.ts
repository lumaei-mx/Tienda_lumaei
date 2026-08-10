import Stripe from "stripe";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurada");
  return new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
  });
}

/** Monto en unidad menor (centavos / centavos MXN) */
export function toStripeAmount(total: number) {
  return Math.round(total * 100);
}

export function fromStripeAmount(amount: number) {
  return Number((amount / 100).toFixed(2));
}
