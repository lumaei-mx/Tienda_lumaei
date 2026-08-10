"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export default function SobreNosotrosPage() {
  const lang = useCart((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {t("lumaeiEyebrow", lang)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {t("aboutTitle", lang)}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <p>{t("aboutP1", lang)}</p>
        <p>{t("aboutP2", lang)}</p>
        <p>{t("aboutP3", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("aboutCommitT", lang)}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("aboutC1", lang)}</li>
          <li>{t("aboutC2", lang)}</li>
          <li>{t("aboutC3", lang)}</li>
          <li>{t("aboutC4", lang)}</li>
        </ul>
      </div>

      <Link
        href="/productos"
        className="mt-10 inline-block rounded-full bg-brown px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-gold-dark"
      >
        {t("viewCatalog", lang)}
      </Link>
    </div>
  );
}
