"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Search, Download, Wifi, WifiOff } from "lucide-react";
import { invalidateProductsCache } from "@/lib/use-products";

interface SearchItem {
  id: string;
  name: string;
  image?: string;
  priceUsd: number;
  stock: number;
  category?: string;
  sku?: string;
}

export function CjImportPanel() {
  const [status, setStatus] = useState<{
    ok?: boolean;
    configured?: boolean;
    mode?: string;
    error?: string;
  } | null>(null);
  const [q, setQ] = useState("kitchen organizer");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/cj/status")
      .then(async (r) => {
        if (r.status === 401) {
          setStatus({ ok: false, configured: true, error: "Sesión expirada — recarga la página de admin" });
          return;
        }
        const data = await r.json();
        setStatus(data);
      })
      .catch(() => setStatus({ ok: false, error: "No status" }));
  }, []);

  async function search() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(
        `/api/cj/products/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setItems(data.items || []);
      if (!(data.items || []).length) setMsg("Sin resultados");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error búsqueda");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function importPid(pid: string, featured = false) {
    setImporting(pid);
    setMsg("");
    try {
      const res = await fetch("/api/cj/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, featured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error import");
      invalidateProductsCache();
      setMsg(`Importado: ${data.product.name} → /productos/${data.product.slug}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Importar desde CJ
          </h2>
          <p className="mt-1 text-sm text-brown-soft">
            Busca en el catálogo real de CJ Dropshipping e importa con pricing
            automático MX/US.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            status?.ok
              ? "bg-gold/20 text-gold-dark"
              : "bg-cream text-brown-soft"
          }`}
        >
          {status?.ok ? <Wifi size={14} /> : <WifiOff size={14} />}
          {status?.ok
            ? `CJ conectado (${status.mode})`
            : status?.configured
              ? `CJ error: ${status.error || "auth"}`
              : "CJ no configurado"}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Ej: led motion light, car vacuum, pet brush"
          className="min-w-[240px] flex-1 rounded-full border border-gold/30 bg-cream px-4 py-2.5 text-sm outline-none ring-gold focus:ring-2"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !status?.ok}
          className="inline-flex items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-ivory disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          Buscar
        </button>
      </div>

      {msg && (
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm text-brown">
          {msg}
        </p>
      )}

      <ul className="mt-5 divide-y divide-gold/10">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="64px"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-brown">{item.name}</p>
              <p className="text-xs text-brown-soft">
                ${item.priceUsd.toFixed(2)} USD cost · stock {item.stock}
                {item.category ? ` · ${item.category}` : ""}
              </p>
              <p className="text-[11px] text-brown-soft/70">
                PID {item.id.slice(0, 18)}… {item.sku || ""}
              </p>
            </div>
            <button
              type="button"
              disabled={importing === item.id}
              onClick={() => importPid(item.id)}
              className="inline-flex h-fit items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-brown hover:bg-cream disabled:opacity-50"
            >
              {importing === item.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Importar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
