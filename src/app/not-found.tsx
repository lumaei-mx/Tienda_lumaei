import Link from "next/link";
import { Compass } from "lucide-react";
import { t, detectLangServer } from "@/lib/i18n";

export default async function NotFound() {
  const lang = await detectLangServer();
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Compass size={40} className="mx-auto text-gold-dark" />
      <p className="mt-4 font-serif text-6xl font-semibold text-brown">404</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-brown">
        {t("notFoundTitle", lang)}
      </h1>
      <p className="mt-2 text-sm text-brown-soft">{t("notFoundMsg", lang)}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-brown px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-gold-dark"
      >
        {t("notFoundCta", lang)}
      </Link>
    </div>
  );
}
