"use client";

import { useEffect, useState } from "react";
import { invalidateProductsCache } from "@/lib/use-products";

interface CatalogItem {
  id: string;
  name: string;
  priceUsd: number;
  active: boolean;
}

interface SeasonView {
  key: string;
  name: string;
  emoji?: string;
  start: string;
  end: string;
  count: number;
  items: CatalogItem[];
}

export function CatalogsPanel() {
  const [current, setCurrent] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonView[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/catalogs")
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d.current?.key || null);
        setNext(d.next?.key || null);
        setSeasons(d.seasons || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function removeFromSeason(season: string, productId: string) {
    const res = await fetch(`/api/admin/catalogs/${season}?productId=${productId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setSeasons((prev) =>
      prev.map((s) =>
        s.key === season
          ? { ...s, items: s.items.filter((i) => i.id !== productId), count: s.count - 1 }
          : s
      )
    );
    invalidateProductsCache();
  }

  if (loading) {
    return <p className="text-sm text-brown-soft">Cargando catálogos…</p>;
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Catálogos por temporada
          </h2>
          <p className="mt-1 text-sm text-brown-soft">
            Calendario fijo anual. El cron activa los productos de la temporada
            vigente y desactiva los de la anterior automáticamente.
          </p>
        </div>
        {current && (
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold-dark">
            Temporada activa:{" "}
            {seasons.find((s) => s.key === current)?.name || current}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((s) => (
          <div
            key={s.key}
            className={`rounded-2xl border p-4 ${
              s.key === current
                ? "border-gold bg-gold/10"
                : "border-gold/20 bg-cream/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg font-semibold text-brown">
                {s.emoji} {s.name}
              </p>
              {s.key === current && (
                <span className="rounded-full bg-brown px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ivory">
                  Activa
                </span>
              )}
              {s.key === next && (
                <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brown-soft">
                  Sigue
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-brown-soft">
              {s.start} → {s.end} · {s.count} producto(s)
            </p>
            <button
              type="button"
              onClick={() => setOpen(open === s.key ? null : s.key)}
              className="mt-3 w-full rounded-full border border-gold/30 px-3 py-1.5 text-xs font-semibold text-brown hover:bg-cream"
            >
              {open === s.key ? "Ocultar" : "Ver productos"}
            </button>
            {open === s.key && (
              <ul className="mt-3 space-y-1.5">
                {s.items.length === 0 && (
                  <li className="text-xs text-brown-soft">
                    Sin productos asignados.
                  </li>
                )}
                {s.items.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-brown">{i.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="text-brown-soft">
                        ${i.priceUsd.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromSeason(s.key, i.id)}
                        className="text-brown-soft/60 hover:text-red-700"
                        title="Quitar de temporada"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
