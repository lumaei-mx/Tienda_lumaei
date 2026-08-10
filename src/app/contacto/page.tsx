"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export default function ContactoPage() {
  const lang = useCart((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {t("helpEyebrow", lang)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {t("contTitle", lang)}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <p>{t("contIntro", lang)}</p>

        <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
          <p className="text-sm font-semibold text-brown">{t("contEmail", lang)}</p>
          <a href="mailto:lumaeiMX@gmail.com" className="text-gold-dark underline">
            lumaeiMX@gmail.com
          </a>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
          <p className="text-sm font-semibold text-brown">{t("contWhatsapp", lang)}</p>
          <a
            href="https://wa.me/14084223904"
            target="_blank"
            rel="noopener"
            className="text-gold-dark underline"
          >
            +1 408 422 3904
          </a>
          <p className="mt-1 text-xs text-brown-soft">{t("contWhatsappNote", lang)}</p>
        </div>

        <p className="text-sm">{t("contHours", lang)}</p>
      </div>

      <Link
        href="/productos"
        className="mt-10 inline-block rounded-full bg-brown px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-gold-dark"
      >
        {t("keepShopping", lang)}
      </Link>
    </div>
  );
}
