"use client";

import type { PublicProduct } from "@/lib/types";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { getProductCopy, buildFallbackCopy, pickCopy, productName } from "@/lib/copy";
import { groupCategory, groupLabel } from "@/lib/categories";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductPrice } from "@/components/ProductPrice";
import { ProductGallery } from "@/components/ProductGallery";
import { TrustBadges } from "@/components/TrustBadges";
import { ProductReviews } from "@/components/ProductReviews";
import { BackButton } from "@/components/BackButton";
import { SectionTitle } from "@/components/SectionTitle";
import { ChevronDown, Check } from "lucide-react";

export function ProductPageView({ product }: { product: PublicProduct }) {
  const lang = useCart((s) => s.lang);
  const curated = getProductCopy(product);
  const base =
    curated && (lang === "es" || curated.hookEn)
      ? curated
      : buildFallbackCopy(product, lang);
  const copy = pickCopy(base, lang);
  const group = groupLabel(groupCategory(product.category), lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} alt={productName(product, lang)} />

        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
            {group}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brown">
            {copy.hook}
          </h1>
          <p className="mt-3 leading-relaxed text-brown-soft">{copy.subtitle}</p>

          <div className="mt-5">
            <ProductPrice product={product} />
          </div>

          <ul className="mt-6 space-y-2.5">
            {copy.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-brown-soft">
                <Check size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-gold-dark" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <AddToCartButton
              productId={product.id}
              product={{
                id: product.id,
                name: product.name,
                category: product.category,
                priceUsd: product.priceUsd,
              }}
            />
            <div className="mt-2 text-center text-xs text-brown-soft sm:text-left">
              <SectionTitle k="productTrust" as="p" />
            </div>
          </div>

          <TrustBadges />
        </div>
      </div>

      {/* Descripción */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <SectionTitle k="productDescription" className="font-serif text-2xl font-semibold text-brown" />
          <div className="mt-4 whitespace-pre-line leading-relaxed text-brown-soft">
            {copy.description}
          </div>
        </div>
        <div>
          <SectionTitle k="productSpecs" className="font-serif text-2xl font-semibold text-brown" />
          <ul className="mt-4 space-y-2 text-sm text-brown-soft">
            {copy.specs.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ChevronDown size={15} className="mt-0.5 shrink-0 -rotate-90 text-gold-dark" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <SectionTitle k="productFaq" className="font-serif text-2xl font-semibold text-brown" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {copy.faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gold/20 bg-ivory px-5 py-4"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-brown">
                {f.q}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-gold-dark transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-brown-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <ProductReviews product={product} />
    </div>
  );
}
