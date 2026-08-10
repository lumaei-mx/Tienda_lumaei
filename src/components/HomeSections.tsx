"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, Shield, Sparkles, Truck } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import type { PublicProduct } from "@/lib/types";

export function HeroSection() {
  const lang = useCart((s) => s.lang);
  return (
    <section className="relative overflow-hidden border-b border-gold/20 bg-gradient-to-b from-ivory via-cream to-cream-dark">
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_70%_20%,rgba(196,163,90,0.25)_0,transparent_45%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
            <Sparkles size={14} /> {t("heroEyebrow", lang)}
          </p>
          <h1 className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-brown md:text-6xl">
            {t("heroTitleA", lang)}
            <span className="mt-2 block italic text-gold-dark">
              {t("heroTitleB", lang)}
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-brown-soft">
            {t("heroSubtitle", lang)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 rounded-full bg-brown px-6 py-3 text-sm font-semibold tracking-wide text-ivory transition hover:bg-gold-dark"
            >
              {t("heroCta", lang)} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative w-full max-w-md rounded-3xl border border-gold/30 bg-ivory p-8 shadow-[0_20px_60px_-20px_rgba(61,43,31,0.25)]">
            <Image
              src="/logo-lumaei-sm.png"
              alt="Lumaei"
              width={420}
              height={306}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ValueCards() {
  const lang = useCart((s) => s.lang);
  const cards = [
    { icon: Truck, t: t("valueShipT", lang), d: t("valueShipD", lang) },
    { icon: Package, t: t("valuePackT", lang), d: t("valuePackD", lang) },
    { icon: Sparkles, t: t("valueCurT", lang), d: t("valueCurD", lang) },
    { icon: Shield, t: t("valueSafeT", lang), d: t("valueSafeD", lang) },
  ];
  return (
    <section className="border-b border-gold/15 bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, t: title, d }) => (
          <div key={title} className="rounded-2xl border border-gold/15 bg-cream/50 p-5">
            <Icon className="mb-3 text-gold" size={20} strokeWidth={1.5} />
            <p className="font-serif text-lg font-semibold text-brown">{title}</p>
            <p className="mt-1 text-sm text-brown-soft">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const lang = useCart((s) => s.lang);
  const steps = [
    ["1", t("how1T", lang), t("how1D", lang)],
    ["2", t("how2T", lang), t("how2D", lang)],
    ["3", t("how3T", lang), t("how3D", lang)],
    ["4", t("how4T", lang), t("how4D", lang)],
  ];
  return (
    <section id="como-funciona" className="border-y border-gold/20 bg-brown text-ivory">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          {t("howEyebrow", lang)}
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">
          {t("howTitle", lang)}
        </h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map(([n, title, d]) => (
            <li
              key={n}
              className="rounded-2xl border border-gold/25 bg-white/5 p-5 backdrop-blur"
            >
              <span className="font-serif text-4xl text-gold">{n}</span>
              <p className="mt-3 font-serif text-xl font-semibold">{title}</p>
              <p className="mt-1 text-sm text-ivory/70">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FeaturedSection({ products }: { products: PublicProduct[] }) {
  const lang = useCart((s) => s.lang);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
            {t("featuredEyebrow", lang)}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-brown md:text-4xl">
            {t("featuredTitle", lang)}
          </h2>
        </div>
        <Link
          href="/productos"
          className="text-sm font-semibold tracking-wide text-gold-dark underline-offset-4 hover:underline"
        >
          {t("viewAll", lang)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
