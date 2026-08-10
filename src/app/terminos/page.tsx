"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export default function TerminosPage() {
  const lang = useCart((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {t("legalEyebrow", lang)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {t("termsTitle", lang)}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("termsPrivacyT", lang)}
        </h2>
        <p>{t("termsPrivacy", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("termsCookiesT", lang)}
        </h2>
        <p>{t("termsCookies", lang)}</p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("termsBuyT", lang)}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("termsBuy1", lang)}</li>
          <li>{t("termsBuy2", lang)}</li>
          <li>{t("termsBuy3", lang)}</li>
        </ul>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {t("termsLegalT", lang)}
        </h2>
        <p>
          {t("termsLegal", lang)
            .replace("{email}", "@@EMAIL@@")
            .replace("{whatsapp}", "@@WHATSAPP@@")
            .split(/@@(?:EMAIL|WHATSAPP)@@/)
            .reduce<(string | React.ReactNode)[]>((acc, part, i, arr) => {
              acc.push(part);
              if (i < arr.length - 1) {
                acc.push(
                  i === 0 ? (
                    <a
                      key="email"
                      href="mailto:lumaeiMX@gmail.com"
                      className="text-gold-dark underline"
                    >
                      lumaeiMX@gmail.com
                    </a>
                  ) : (
                    <a
                      key="whatsapp"
                      href="https://wa.me/14084223904"
                      className="text-gold-dark underline"
                    >
                      WhatsApp
                    </a>
                  )
                );
              }
              return acc;
            }, [])}
        </p>
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
