"use client";

import type { PublicProduct } from "@/lib/types";
import { formatPrice, productPrice } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useCart } from "@/lib/cart-store";

export function ProductPrice({ product }: { product: PublicProduct }) {
  const lang = useCart((s) => s.lang);
  const price = productPrice(product);

  return (
    <div>
      <p className="font-serif text-4xl font-semibold text-brown">
        {formatPrice(price, lang)}
      </p>
      <p className="text-xs tracking-wide text-brown-soft">
        {t("priceNote", lang)}
      </p>
    </div>
  );
}
