"use client";

import { useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { groupCategory, groupLabel, ALL_GROUPS, type CatalogGroup } from "@/lib/categories";
import type { PublicProduct } from "@/lib/types";

type SortMode = "recommended" | "price_asc" | "price_desc" | "newest";

// Sinónimos ES→EN para que el buscador encuentre productos por términos
// locales aunque el catálogo CJ venga en inglés.
const SYNONYMS: Record<string, string> = {
  gato: "cat",
  gatos: "cat",
  perro: "dog",
  perros: "dog",
  mascota: "pet",
  mascotas: "pet",
  cocina: "kitchen",
  hogar: "home",
  coche: "car",
  auto: "car",
  luz: "light",
  lampara: "light",
  cargador: "charger",
  cable: "cable",
  botella: "bottle",
  hielo: "ice",
  libros: "book",
  cepillo: "brush",
  peines: "comb",
  soporte: "stand",
  caja: "box",
  organizador: "organizer",
  refri: "refrigerator",
  frio: "ice",
  vino: "drink",
  agua: "water",
  baño: "bath",
  shampoo: "shampoo",
};

function expandQuery(q: string): Array<{ terms: string[] }> {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Cada palabra original se expande a un grupo de alternativas (palabra + sinónimos).
  // El producto matchea si para CADA grupo, al menos una alternativa está presente.
  return words.map((w) => {
    const alternatives = new Set<string>([w]);
    if (SYNONYMS[w]) alternatives.add(SYNONYMS[w]);
    return { terms: [...alternatives] };
  });
}

export default function Catalog({ products }: { products: PublicProduct[] }) {
  const lang = useCart((s) => s.lang);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<CatalogGroup | null>(null);
  const [sort, setSort] = useState<SortMode>("recommended");

  // Debounce simple del buscador (300ms)
  const [debounced, setDebounced] = useState("");
  const [typing, setTyping] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeQuery = (v: string) => {
    setQuery(v);
    setTyping(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebounced(v);
      setTyping(false);
    }, 300);
  };

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    let list = products;
    if (group) list = list.filter((p) => groupCategory(p.category) === group);
    if (q) {
      const groups = expandQuery(q);
      const haystack = (p: PublicProduct) =>
        `${p.name} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
      list = list.filter((p) =>
        groups.every(({ terms }) => terms.some((term) => haystack(p).includes(term)))
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "price_asc":
        sorted.sort((a, b) => a.priceUsd - b.priceUsd);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.priceUsd - a.priceUsd);
        break;
      case "newest":
        sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.reviews - a.reviews);
        break;
      default:
        // Recomendados: featured primero, luego rating
        sorted.sort(
          (a, b) =>
            (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating
        );
    }
    return sorted;
  }, [products, group, debounced, sort]);

  const countLabel =
    filtered.length === 1
      ? t("catalogCountOne", lang)
      : t("catalogCountMany", lang).replace("{n}", String(filtered.length));

  return (
    <div>
      {/* Header del catálogo (reactivo al idioma) */}
      <div className="pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
          {t("catalogEyebrow", lang)}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
          {t("catalogTitle", lang)}
        </h1>
        <p className="mt-2 text-brown-soft">{t("catalogSubtitle", lang)}</p>
      </div>

      {/* Barra de herramientas: buscador + orden */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-soft/60"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder={t("catalogSearch", lang)}
            className="w-full rounded-full border border-gold/30 bg-ivory py-2.5 pl-10 pr-4 text-sm outline-none ring-gold placeholder:text-brown-soft/60 focus:ring-2"
            aria-label={t("catalogSearch", lang)}
          />
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <SlidersHorizontal
            size={15}
            className="text-brown-soft/60"
            strokeWidth={1.75}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-full border border-gold/30 bg-ivory px-4 py-2.5 text-sm text-brown outline-none ring-gold focus:ring-2"
            aria-label={t("catalogSort", lang)}
          >
            <option value="recommended">{t("sortRecommended", lang)}</option>
            <option value="price_asc">{t("sortPriceAsc", lang)}</option>
            <option value="price_desc">{t("sortPriceDesc", lang)}</option>
            <option value="newest">{t("sortNewest", lang)}</option>
          </select>
        </div>
      </div>

      {/* Filtros por grupo limpio */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setGroup(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium tracking-wide transition ${
            group === null
              ? "bg-brown text-ivory"
              : "border border-gold/30 bg-ivory text-brown-soft hover:border-gold/50"
          }`}
        >
          {t("catalogAll", lang)}
        </button>
        {ALL_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(group === g ? null : g)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium tracking-wide transition ${
              group === g
                ? "bg-brown text-ivory"
                : "border border-gold/30 bg-ivory text-brown-soft hover:border-gold/50"
            }`}
          >
            {groupLabel(g, lang)}
          </button>
        ))}
        <span className="ml-auto text-sm text-brown-soft">{countLabel}</span>
      </div>

      {/* Grid compacto 4 columnas */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} compact />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-brown-soft">
          {t("catalogNoResults", lang)}
        </p>
      )}

      {typing && (
        <p className="mt-4 text-center text-xs text-brown-soft/60">
          {t("catalogSearching", lang)}
        </p>
      )}
    </div>
  );
}
