"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

/**
 * Flecha "atrás" acorde al diseño (brown/gold, hit area 44px).
 * - Si llegamos desde una página interna de la tienda → history.back()
 * - Si entramos directo (o desde afuera) → catálogo
 */
export function BackButton({ href = "/productos" }: { href?: string }) {
  const router = useRouter();
  const lang = useCart((s) => s.lang);

  function goBack() {
    if (typeof window === "undefined") return;
    let internalReferrer = false;
    try {
      internalReferrer =
        window.history.length > 1 &&
        document.referrer !== "" &&
        new URL(document.referrer).origin === window.location.origin;
    } catch {
      internalReferrer = false;
    }
    if (internalReferrer) {
      router.back();
    } else {
      router.push(href);
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={t("back", lang)}
      title={t("back", lang)}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-ivory text-brown shadow-sm transition hover:border-gold hover:bg-cream-dark"
    >
      <ArrowLeft size={20} strokeWidth={1.75} />
    </button>
  );
}
