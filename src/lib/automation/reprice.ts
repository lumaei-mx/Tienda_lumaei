import { readProducts, upsertProduct } from "@/lib/products-db";
import { readStoreSettings } from "@/lib/settings-db";
import type { Market, Product } from "@/lib/types";
import { notifyOwner } from "./alert";

/**
 * Repricing automático del precio de venta USD.
 * Piso = landed_max / (1 − fee − comisión afiliado − margen mínimo).
 * Markup estándar = landed_max × markup (si supera el piso, gana).
 * No toca productos con manualPriceUsd ni sin costo/stock.
 * Corre en cron y puede dispararse a mano.
 */
export async function runReprice(): Promise<{
  checked: number;
  repriced: number;
  stopped: number;
  details: Array<{ id: string; note: string }>;
}> {
  const s = await readStoreSettings();
  const markup = s.markup ?? 2.6;
  const minMargin = s.minMarginPct ?? 12;
  const feeRate = s.paymentFeeRate ?? 0.036;
  const inflPct = (s.influencerCommissionPct ?? 15) / 100;
  const products = await readProducts();
  let repriced = 0;
  let stopped = 0;
  const details: Array<{ id: string; note: string }> = [];

  for (const p of products) {
    if (!p.costUsd || p.costUsd <= 0) continue;

    const landedMx = p.costUsd + (p.shippingMxUsd || 0);
    const landedUs = p.costUsd + (p.shippingUsUsd || 0);
    const landedMax = Math.max(landedMx, landedUs);

    // Piso que cubre COGS + fee + comisión afiliado + margen mínimo.
    const reserved = feeRate + inflPct + minMargin / 100;
    const floor =
      reserved >= 0.95
        ? Number((landedMax * 3).toFixed(2))
        : Number((landedMax / (1 - reserved)).toFixed(2));
    const formulaTarget = Number(
      Math.max(landedMax * markup, floor).toFixed(2)
    );

    // Respetar precio manual fijado en admin.
    const target =
      typeof p.manualPriceUsd === "number" && p.manualPriceUsd > 0
        ? Number(p.manualPriceUsd.toFixed(2))
        : formulaTarget;

    const next: Product = { ...p };

    if (target >= 0.5 && target !== p.priceUsd) {
      next.priceUsd = target;
    }

    // Margen neto tras fee + comisión (peor mercado).
    const netMx = netMarginPct(next, "MX", next.priceUsd, feeRate, inflPct);
    const netUs = netMarginPct(next, "US", next.priceUsd, feeRate, inflPct);
    const worst = Math.min(netMx, netUs);

    if (worst < minMargin) {
      // Si el precio es manual y no alcanza, no desactivar en silencio:
      // subir al piso salvo que sea manual (entonces desactivar).
      if (typeof p.manualPriceUsd === "number" && p.manualPriceUsd > 0) {
        if (next.active) {
          next.active = false;
          stopped++;
          details.push({
            id: p.id,
            note: `INACTIVO manual bajo piso (neto MX ${netMx.toFixed(1)}% / US ${netUs.toFixed(1)}% < ${minMargin}%)`,
          });
        }
        await upsertProduct(next);
        continue;
      }
      // Forzar al piso y re-evaluar.
      next.priceUsd = floor;
      const netMx2 = netMarginPct(next, "MX", next.priceUsd, feeRate, inflPct);
      const netUs2 = netMarginPct(next, "US", next.priceUsd, feeRate, inflPct);
      if (Math.min(netMx2, netUs2) < minMargin) {
        if (next.active) {
          next.active = false;
          stopped++;
          details.push({
            id: p.id,
            note: `INACTIVO (neto MX ${netMx2.toFixed(1)}% / US ${netUs2.toFixed(1)}% < ${minMargin}%)`,
          });
        }
        await upsertProduct(next);
        continue;
      }
    }

    // Reactivar si estaba inactivo y ahora sí da margen.
    if (!next.active && worst >= minMargin) {
      next.active = true;
      details.push({
        id: p.id,
        note: `REACTIVADO USD $${next.priceUsd} (neto ${worst.toFixed(1)}%)`,
      });
    }

    if (
      next.priceUsd !== p.priceUsd ||
      next.active !== p.active
    ) {
      await upsertProduct(next);
      if (next.priceUsd !== p.priceUsd) {
        repriced++;
        details.push({
          id: p.id,
          note: `USD $${p.priceUsd} → $${next.priceUsd} (neto MX ${netMarginPct(next, "MX", next.priceUsd, feeRate, inflPct).toFixed(1)}% / US ${netMarginPct(next, "US", next.priceUsd, feeRate, inflPct).toFixed(1)}%)`,
        });
      }
    }
  }

  if (stopped > 0) {
    await notifyOwner(
      "reprice_stopped",
      `Reprice: ${stopped} productos desactivados por margen neto bajo (< ${minMargin}%).`,
      "warn"
    );
  }

  return { checked: products.length, repriced, stopped, details };
}

/** Margen neto % tras COGS (cost+ship), fee de pago y comisión de afiliado. */
function netMarginPct(
  p: Product,
  market: Market,
  price: number,
  feeRate: number,
  inflPct: number
) {
  if (price <= 0) return 0;
  const ship = market === "MX" ? p.shippingMxUsd : p.shippingUsUsd;
  const cogs = p.costUsd + (ship || 0);
  const fee = price * feeRate;
  const commission = price * inflPct;
  const profit = price - cogs - fee - commission;
  return (profit / price) * 100;
}
