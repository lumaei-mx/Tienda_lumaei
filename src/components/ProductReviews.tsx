"use client";

import { BadgeCheck, Star } from "lucide-react";
import type { PublicProduct } from "@/lib/types";
import { getProductCopy, buildFallbackCopy, pickCopy } from "@/lib/copy";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-gold">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < Math.round(n) ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export function ProductReviews({ product }: { product: PublicProduct }) {
  const lang = useCart((s) => s.lang);
  const copy = pickCopy(getProductCopy(product) ?? buildFallbackCopy(product, lang), lang);
  const reviews = copy.reviews;

  if (!reviews.length) {
    return (
      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("reviewsTitle", lang)}
        </h2>
        <p className="mt-2 text-sm text-brown-soft">{t("reviewsEmpty", lang)}</p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("reviewsTitle", lang)}
        </h2>
        {/* Decisión d109: NUNCA mostrar agregado legacy (copy.reviewAvg /
            copy.reviewCount seeded 4.7/31/47). Estado honesto "Nuevo" + las
            reseñas reales individuales de abajo (sin puntaje agregado). */}
        <span className="rounded-full border border-gold/30 bg-ivory px-3 py-1 text-[11px] font-medium tracking-wide text-brown-soft">
          {t("newLabel", lang)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {reviews.map((r, i) => (
          <article
            key={i}
            className="rounded-2xl border border-gold/20 bg-ivory p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stars n={r.stars} />
                {r.verified && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <BadgeCheck size={13} /> {t("reviewsBadge", lang)}
                  </span>
                )}
              </div>
              <span className="text-xs text-brown-soft">{r.date}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brown-soft">{r.text}</p>
            <p className="mt-3 text-xs font-semibold text-brown">{r.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
