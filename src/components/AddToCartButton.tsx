"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { trackAddToCart, trackClickButton } from "@/lib/tiktok-pixel";

interface AddToCartProduct {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
}

export function AddToCartButton({
  productId,
  product,
}: {
  productId: string;
  product?: AddToCartProduct;
}) {
  const add = useCart((s) => s.add);
  const lang = useCart((s) => s.lang);
  const [ok, setOk] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(productId);
        if (product) {
          trackClickButton(product);
          trackAddToCart({ ...product, quantity: 1 });
        }
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brown px-6 py-3.5 text-sm font-semibold tracking-wide text-ivory transition hover:bg-gold-dark sm:w-auto"
    >
      {ok ? <Check size={18} /> : <ShoppingBag size={18} strokeWidth={1.5} />}
      {ok ? t("addToCartOk", lang) : t("addToCart", lang)}
    </button>
  );
}
