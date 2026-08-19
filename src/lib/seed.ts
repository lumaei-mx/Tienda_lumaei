import { upsertPromo } from "./promo-db";
import type { Promo } from "./promo-db";

/**
 * Promo de bienvenida para captura de email (lead magnet "5 gadgets").
 * 10% de descuento, mercados MX + US, sin mínimo. Idempotente: upsertPromo
 * preserva usedCount/createdAt si ya existe, así que se puede llamar en cada
 * request sin corruptar el contador de uso.
 */
export const WELCOME_PROMO_CODE = "LUMAI10";

export async function ensureWelcomePromo(): Promise<void> {
  const now = new Date().toISOString();
  const promo: Promo = {
    code: WELCOME_PROMO_CODE,
    type: "percent",
    value: 10,
    markets: ["MX", "US"],
    active: true,
    usageLimit: 2000,
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await upsertPromo(promo);
}
