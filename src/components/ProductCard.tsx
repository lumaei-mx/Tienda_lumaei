"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import type { PublicProduct } from "@/lib/types";
import { useCart } from "@/lib/cart-store";
import { formatPrice, productPrice } from "@/lib/money";
import { t } from "@/lib/i18n";
import { productName } from "@/lib/copy";
import { groupCategory, groupLabel } from "@/lib/categories";
import { trackAddToCart } from "@/lib/tiktok-pixel";

export function ProductCard({
  product,
  compact = false,
}: {
  product: PublicProduct;
  compact?: boolean;
}) {
  const add = useCart((s) => s.add);
  const lang = useCart((s) => s.lang);
  const price = productPrice(product);
  const name = productName(product, lang);
  const group = groupLabel(groupCategory(product.category), lang);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-ivory shadow-sm transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
      <Link
        href={`/productos/${product.slug}`}
        className={`relative overflow-hidden bg-cream-dark ${
          compact ? "aspect-[3/4]" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={product.images[0]}
          alt={name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
          unoptimized={!product.images[0]?.includes("unsplash")}
        />
        <span className="absolute left-3 top-3 rounded-full border border-gold/30 bg-ivory/95 px-2.5 py-1 text-[11px] font-medium tracking-wide text-brown-soft">
          {group}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center gap-1 text-gold">
          <Star size={14} fill="currentColor" />
          <span className="text-xs font-medium text-brown-soft">
            {product.rating}
            {product.reviews > 0
              ? ` · ${product.reviews} ${t("reviewsLabel", lang)}`
              : ` · ${t("newLabel", lang)}`}
          </span>
        </div>
        <Link href={`/productos/${product.slug}`}>
          <h3 className="font-serif text-xl font-semibold leading-snug text-brown line-clamp-2">
            {name}
          </h3>
        </Link>
        <p className="mt-2 text-lg font-semibold text-gold-dark">
          {formatPrice(price, lang)}
        </p>
        <button
          type="button"
          onClick={() => {
            add(product.id);
            trackAddToCart({
              id: product.id,
              name: product.name,
              category: product.category,
              priceUsd: product.priceUsd,
              quantity: 1,
            });
          }}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-brown px-3 py-2.5 text-sm font-medium tracking-wide text-ivory transition hover:bg-gold-dark"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          {t("addToCart", lang)}
        </button>
      </div>
    </article>
  );
}
