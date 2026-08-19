"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useProducts } from "@/lib/use-products";
import { useStoreSettings } from "@/lib/use-store-settings";
import { BackButton } from "@/components/BackButton";
import type { Product } from "@/lib/types";
import { formatByMarket, productPrice } from "@/lib/money";
import { t } from "@/lib/i18n";
import { productName } from "@/lib/copy";

export default function CarritoPage() {
  const items = useCart((s) => s.items);
  const lang = useCart((s) => s.lang);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const { byId, loading } = useProducts();
  const market = useCart((s) => s.market);
  const { settings } = useStoreSettings();

  const lines = items
    .map((i) => {
      const p = byId(i.productId);
      if (!p) return null;
      return { ...i, product: p, price: productPrice(p) };
    })
    .filter(Boolean) as {
    productId: string;
    qty: number;
    product: Product;
    price: number;
  }[];

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totalQty = lines.reduce((n, l) => n + l.qty, 0);
  const minQty = settings.freeShippingMinQty || 0;
  const needForFree = minQty > 0 ? Math.max(0, minQty - totalQty) : 0;
  const freeShipUnlocked = minQty > 0 && totalQty >= minQty;

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-brown-soft">
        {t("loadingCart", lang)}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{t("cartEmpty", lang)}</h1>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded-full bg-brown px-5 py-3 text-sm font-semibold text-ivory"
        >
          {t("goToCollection", lang)}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-4 flex items-center gap-4">
          <BackButton href="/productos" />
          <h1 className="font-serif text-3xl font-semibold text-brown">
            {t("cartTitle", lang)}
          </h1>
        </div>
        <ul className="mt-6 space-y-4">
          {lines.map((l) => (
            <li
              key={l.productId}
              className="flex gap-4 rounded-2xl border border-gold/20 bg-ivory p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                <Image
                  src={l.product.images[0]}
                  alt={productName(l.product, lang)}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg font-semibold text-brown">{productName(l.product, lang)}</p>
                    <p className="text-sm text-gold-dark">
                      {formatByMarket(l.price, market, settings.usdToMxn)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.productId)}
                    className="text-brown-soft/50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gold/30 p-1"
                    onClick={() => setQty(l.productId, l.qty - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{l.qty}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-gold/30 p-1"
                    onClick={() => setQty(l.productId, l.qty + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-2xl border border-gold/20 bg-ivory p-5">
        <h2 className="font-serif text-xl font-semibold">{t("summary", lang)}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-brown-soft">{t("subtotal", lang)}</dt>
            <dd>{formatByMarket(subtotal, market, settings.usdToMxn)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">{t("shipping", lang)}</dt>
            <dd className={freeShipUnlocked ? "font-semibold text-gold-dark" : "text-brown-soft"}>
              {freeShipUnlocked ? t("free", lang) : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brown-soft">{t("iva", lang)}</dt>
            <dd className="text-brown-soft">—</dd>
          </div>
          <div className="flex justify-between border-t border-gold/20 pt-2 text-base font-bold">
            <dt>{t("total", lang)}</dt>
            <dd>{formatByMarket(subtotal, market, settings.usdToMxn)}</dd>
          </div>
        </dl>

        {minQty > 0 && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
              freeShipUnlocked
                ? "border-gold/50 bg-cream text-brown"
                : "border-gold/30 bg-white text-brown-soft"
            }`}
          >
            {freeShipUnlocked
              ? t("cartFreeShipUnlocked", lang)
              : t("cartFreeShipNeed", lang).replace("{n}", String(needForFree))}
          </div>
        )}

        <p className="mt-3 text-xs text-brown-soft">{t("shippingNote", lang)}</p>
        <p className="mt-2 text-xs font-medium text-gold-dark">{t("cartPromoHint", lang)}</p>
        <p className="mt-1 text-[11px] text-brown-soft">{t("cartTrustLine", lang)}</p>

        <Link
          href="/checkout"
          className="mt-4 flex w-full items-center justify-center rounded-full bg-brown py-3 text-sm font-semibold tracking-wide text-ivory hover:bg-gold-dark"
        >
          {t("checkout", lang)}
        </Link>
      </aside>
    </div>
  );
}
