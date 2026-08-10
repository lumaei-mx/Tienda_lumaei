"use client";

import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-store";
import { useStoreSettings } from "@/lib/use-store-settings";
import { formatMoney, marginForProduct } from "@/lib/money";

export function MarginBadge({ product }: { product: Product }) {
  const market = useCart((s) => s.market);
  const { settings } = useStoreSettings();
  const m = marginForProduct(settings, product, market);

  return (
    <div className="rounded-xl border border-gold/30 bg-cream px-3 py-2 text-xs text-brown-soft">
      Margen estimado {market}: <strong className="text-brown">{m.marginPct}%</strong> ·
      ganancia ~ {formatMoney(m.profit)}/ud (COGS + envío CJ + fee)
    </div>
  );
}
