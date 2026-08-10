"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Eye, X } from "lucide-react";
import { invalidateProductsCache } from "@/lib/use-products";

interface Opportunity {
  pid: string;
  name: string;
  image?: string;
  category?: string;
  costUsd: number;
  landedUs: number;
  suggestedPriceUsd: number;
  profitUsd: number;
  marginPct: number;
  trendScore: number;
  stock: number;
  score: number;
  status: string;
  season?: string;
  sku?: string;
  competitorPriceUsd?: number | null;
  competitorSource?: "cj" | "amazon" | "mercadolibre" | null;
}

type PriceResult = {
  suggestedPriceUsd: number;
  recommendedPriceUsd: number | null;
  profitUsd: number;
  marginPct: number;
  bestCompetitor: { priceUsd: number; source: string; url?: string } | null;
  competitors: Array<{ priceUsd: number; source: string; url?: string }>;
  reason: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "Nueva",
  approved: "Aprobada",
  rejected: "Rechazada",
  imported: "Importada",
};

const SOURCE_LABEL: Record<string, string> = {
  cj: "CJ Dropshipping",
  amazon: "Amazon",
  mercadolibre: "MercadoLibre",
};

// Por defecto la cola de decisión: "new" (al aprobar, el item se publica en
// Catálogo y desaparece de esta lista). "imported" queda como historial bajo
// demanda para verificar qué se ha importado ya.
const FILTERS = [
  { value: "new", label: "Nuevas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "imported", label: "Importadas" },
] as const;

function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] || source;
}

export function OpportunitiesPanel() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [busyCheck, setBusyCheck] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<string>("new");
  const [priceResults, setPriceResults] = useState<Record<string, PriceResult>>({});
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/opportunities${filter ? `?status=${filter}` : ""}`
      );
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch {
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function approve(opp: Opportunity, manualPrice?: number) {
    setBusy(opp.pid);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/opportunities/${opp.pid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualPriceUsd: manualPrice ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      invalidateProductsCache();
      setMsg(
        data.manualPriceUsd
          ? `Importado: ${data.product.name} → temporada ${data.season} (precio manual $${data.manualPriceUsd})`
          : `Importado: ${data.product.name} → temporada ${data.season}`
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function reject(opp: Opportunity) {
    setBusy(opp.pid);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/opportunities/${opp.pid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error");
      setMsg(`Rechazada: ${opp.name}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function checkPrice(opp: Opportunity) {
    setBusyCheck(opp.pid);
    try {
      const res = await fetch(`/api/admin/opportunities/${opp.pid}`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPriceResults((p) => ({ ...p, [opp.pid]: data }));
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyCheck(null);
    }
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Cazador de oportunidades CJ
          </h2>
          <p className="mt-1 text-sm text-brown-soft">
            Productos baratos con buen margen detectados por el hunter diario.
            Aprueba para importar y asignar a la temporada vigente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filter === f.value
                  ? "bg-brown text-ivory"
                  : "border border-gold/30 text-brown-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm text-brown">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-brown-soft">Cargando…</p>
      ) : opportunities.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-gold/40 p-8 text-center text-sm text-brown-soft">
          Sin oportunidades todavía. El cron hunter las genera diariamente
          (o corre /api/cron/hunter manualmente).
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-gold/10">
          {opportunities.map((opp) => (
            <li key={opp.pid} className="flex gap-4 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                {opp.image && (
                  <Image
                    src={opp.image}
                    alt={opp.name}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="64px"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-brown">{opp.name}</p>
                <p className="mt-0.5 text-xs text-brown-soft">
                  Costo total {opp.landedUs.toFixed(2)} · Venta sugerida{" "}
                  {opp.suggestedPriceUsd.toFixed(2)} · Ganancia{" "}
                  <strong className="text-gold-dark">
                    ${opp.profitUsd.toFixed(2)}/ud
                  </strong>{" "}
                  · Margen {opp.marginPct}%
                </p>
                {opp.sku && (
                  <p className="mt-0.5 font-mono text-[11px] text-brown-soft/80">
                    SKU: {opp.sku}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-cream px-2 py-0.5 text-brown-soft">
                    {opp.category || "General"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      opp.trendScore >= 50
                        ? "bg-gold/20 text-gold-dark"
                        : "bg-cream text-brown-soft"
                    }`}
                  >
                    Trend {opp.trendScore}
                  </span>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-brown-soft">
                    Stock {opp.stock}
                  </span>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-brown-soft">
                    {STATUS_LABEL[opp.status] || opp.status}
                  </span>
                  {opp.season && (
                    <span className="rounded-full bg-cream px-2 py-0.5 text-brown-soft">
                      {opp.season}
                    </span>
                  )}
                </div>
                {priceResults[opp.pid] && (
                  <div className="mt-2 rounded-xl bg-cream px-3 py-2 text-xs text-brown">
                    <p className="font-semibold">
                      Validación de competencia
                    </p>
                    {priceResults[opp.pid].bestCompetitor ? (
                      <p>
                        Competidor vende a{" "}
                        <strong>
                          ${priceResults[opp.pid].bestCompetitor!.priceUsd} USD
                        </strong>{" "}
                        total ({priceResults[opp.pid].bestCompetitor!.source})
                        {" · nosotros: $".concat(
                          opp.suggestedPriceUsd.toFixed(2),
                          " USD",
                          priceResults[opp.pid].bestCompetitor!.priceUsd <
                            opp.suggestedPriceUsd
                            ? " (más caro)"
                            : " (más barato)"
                        )}
                        {priceResults[opp.pid].bestCompetitor!.url && (
                          <>
                            {" · "}
                            <a
                              href={priceResults[opp.pid].bestCompetitor!.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-medium text-gold-dark underline"
                            >
                              Ver en{" "}
                              {sourceLabel(
                                priceResults[opp.pid].bestCompetitor!.source
                              )}{" "}
                              ↗
                            </a>
                          </>
                        )}
                      </p>
                    ) : (
                      <p>No se encontró competencia directa.</p>
                    )}
                    {(() => {
                      const refs = priceResults[
                        opp.pid
                      ].competitors.filter((c) => c.url).slice(0, 3);
                      if (refs.length === 0) return null;
                      return (
                        <p className="mt-1 text-[11px] text-brown-soft">
                          <span className="font-medium text-brown">
                            Referencias:
                          </span>{" "}
                          {refs.map((c, i) => (
                            <span key={`${c.source}-${c.priceUsd}-${i}`}>
                              {i > 0 && " · "}
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold-dark underline"
                              >
                                {sourceLabel(c.source)} ${c.priceUsd} (enlace ↗)
                              </a>
                            </span>
                          ))}
                        </p>
                      );
                    })()}
                    <p>
                      Precio recomendado:{" "}
                      <strong>
                        {priceResults[opp.pid].recommendedPriceUsd
                          ? `$ ${priceResults[opp.pid].recommendedPriceUsd!.toFixed(2)}`
                          : "no rentable"}
                      </strong>{" "}
                      · Ganancia ~${priceResults[opp.pid].profitUsd}/ud
                    </p>
                  </div>
                )}
              </div>
              {opp.status === "new" && (
                <div className="flex shrink-0 items-start gap-2">
                  <div className="flex items-end gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="precio manual"
                      value={manualPrices[opp.pid] ?? ""}
                      onChange={(e) =>
                        setManualPrices((p) => ({ ...p, [opp.pid]: e.target.value }))
                      }
                      className="w-24 rounded-xl border border-gold/30 bg-ivory px-2 py-1 text-xs text-brown placeholder-brown-soft/40"
                    />
                    <span className="text-[10px] text-brown-soft">USD</span>
                  </div>
                  <button
                    type="button"
                    disabled={busy === opp.pid || busyCheck === opp.pid}
                    onClick={() => checkPrice(opp)}
                    className="inline-flex h-fit items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-brown-soft hover:bg-cream disabled:opacity-50"
                  >
                    <Eye size={14} />
                    {busyCheck === opp.pid ? "Validando…" : "Validar comp"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === opp.pid}
                    onClick={() =>
                      approve(opp, manualPrices[opp.pid] ? Number(manualPrices[opp.pid]) : undefined)
                    }
                    className="inline-flex h-fit items-center gap-1 rounded-full bg-brown px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-gold-dark disabled:opacity-50"
                  >
                    <Check size={14} /> Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={busy === opp.pid}
                    onClick={() => reject(opp)}
                    className="inline-flex h-fit items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-brown-soft hover:bg-cream disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {opp.status === "imported" && (
                <span className="shrink-0 text-xs text-gold-dark">
                  <Eye size={14} className="inline" /> En tienda
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}