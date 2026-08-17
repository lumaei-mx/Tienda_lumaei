"use client";

import type { PublicProduct } from "@/lib/types";
import { formatByMarket, productPrice } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useCart } from "@/lib/cart-store";
import { useStoreSettings } from "@/lib/use-store-settings";

export function ProductPrice({ product }: { product: PublicProduct }) {
  const lang = useCart((s) => s.lang);
  const market = useCart((s) => s.market);
  const { settings } = useStoreSettings();
  const price = productPrice(product);

  return (
    <div>
      <p className="font-serif text-4xl font-semibold text-brown">
        {formatByMarket(price, market, settings.usdToMxn)}
      </p>
      <p className="text-xs tracking-wide text-brown-soft">
        {t("priceNote", lang)}
      </p>
    </div>
  );
}
