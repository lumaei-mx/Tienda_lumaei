import { readProducts, upsertProduct } from "@/lib/products-db";
import { readStoreSettings } from "@/lib/settings-db";
import type { Market, Product } from "@/lib/types";
import { notifyOwner } from "./alert";

/**
 * Repricing automático del precio de venta USD a partir del costo real CJ
 * (producto + envío) y un markup único. Corre en cron (00:00 MX).
 * No toca productos sin costo/stock.
 */
export async function runReprice(): Promise<{
  checked: number;
  repriced: number;
  stopped: number;
  details: Array<{ id: string; note: string }>;
}> {
  const s = await readStoreSettings();
  const markup = s.markup ?? 2.6;
  const minMargin = s.minMarginPct ?? 20;
  const products = await readProducts();
  let repriced = 0;
  let stopped = 0;
  const details: Array<{ id: string; note: string }> = [];

  for (const p of products) {
    if (!p.cjProductId || !p.costUsd) continue;

    // costo total real (producto + envío al mercado de mayor costo como piso)
    const landedMx = p.costUsd + p.shippingMxUsd;
    const landedUs = p.costUsd + p.shippingUsUsd;
    const formulaTarget = Number(
      (Math.max(landedMx, landedUs) * markup).toFixed(2)
    );

    // respetar precio manual fijado en admin (no pisarlo con la fórmula)
    const target =
      typeof p.manualPriceUsd === "number" && p.manualPriceUsd > 0
        ? Number(p.manualPriceUsd.toFixed(2))
        : formulaTarget;

    const next: Product = { ...p };

    if (target >= 0.5 && target !== p.priceUsd) {
      next.priceUsd = target;
    }

    // no vender a pérdida: verifica margen mínimo en cada mercado
    const marginMx = marginPct(s, next, "MX", target);
    const marginUs = marginPct(s, next, "US", target);
    if (marginMx < minMargin || marginUs < minMargin) {
      if (next.active) {
        next.active = false;
        stopped++;
        details.push({
          id: p.id,
          note: `INACTIVO (margen MX ${marginMx.toFixed(1)}% / US ${marginUs.toFixed(1)}% < ${minMargin}%)`,
        });
      }
      await upsertProduct(next);
      continue;
    }

    if (next.priceUsd !== p.priceUsd) {
      await upsertProduct(next);
      repriced++;
      details.push({
        id: p.id,
        note: `USD $${next.priceUsd} (margen ${marginMx.toFixed(1)}%/${marginUs.toFixed(1)}%)`,
      });
    }
  }

  if (stopped > 0) {
    await notifyOwner(
      "reprice_stopped",
      `Reprice: ${stopped} productos desactivados por margen bajo (< ${minMargin}%).`,
      "warn"
    );
  }

  return { checked: products.length, repriced, stopped, details };
}

function marginPct(
  s: Awaited<ReturnType<typeof readStoreSettings>>,
  p: Product,
  market: Market,
  price: number
) {
  const ship = market === "MX" ? p.shippingMxUsd : p.shippingUsUsd;
  const cogs = p.costUsd + ship;
  return price > 0 ? ((price - cogs) / price) * 100 : 0;
}
