"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export default function DevolucionesPage() {
  const lang = useCart((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {t("helpEyebrow", lang)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {t("retTitle", lang)}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <p>{t("retIntro", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("retDamagedT", lang)}
        </h2>
        <p>{t("retDamaged", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("retChangeT", lang)}
        </h2>
        <p>{t("retChange", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("retHowT", lang)}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {t("retHow1", lang).replace(
              "{email}",
              "lumaeiMX@gmail.com"
            )}
          </li>
          <li>
            {t("retHow2", lang).replace("{whatsapp}", "WhatsApp")}
          </li>
          <li>{t("retHow3", lang)}</li>
        </ul>
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
