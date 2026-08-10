"use client";

import { useCart } from "@/lib/cart-store";
import { t, type DictKey } from "@/lib/i18n";

/** Título de sección reactivo al idioma (para usarse desde server components). */
export function SectionTitle({
  k,
  className,
  as: Tag = "h2",
}: {
  k: DictKey;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const lang = useCart((s) => s.lang);
  return <Tag className={className}>{t(k, lang)}</Tag>;
}
