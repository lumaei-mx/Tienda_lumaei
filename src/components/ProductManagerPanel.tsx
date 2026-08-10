"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Save, Trash2 } from "lucide-react";
import { invalidateProductsCache } from "@/lib/use-products";

interface ProductRow {
  id: string;
  name: string;
  images?: string[];
  image?: string;
  priceUsd: number;
  costUsd: number;
  shippingUsUsd: number;
  active: boolean;
  stock: number;
}

export function ProductManagerPanel() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(
        (data.products || []).map((p: ProductRow) => ({
          ...p,
          image: p.image || p.images?.[0],
        }))
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function savePrice(p: ProductRow) {
    const raw = prices[p.id];
    if (raw === undefined || raw === "") return;
    const price = Number(raw);
    if (!Number.isFinite(price) || price <= 0) {
      setMsg("Precio inválido");
      return;
    }
    setBusy(p.id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceUsd: price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      invalidateProductsCache();
      setMsg(`Precio actualizado: $${price.toFixed(2)}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: ProductRow) {
    if (!window.confirm(`¿Eliminar "${p.name.slice(0, 60)}..." del catálogo?`)) return;
    setBusy(p.id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Error");
      }
      invalidateProductsCache();
      setMsg(`Eliminado: ${p.name.slice(0, 40)}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-brown">
            Catálogo · editar precios / eliminar
          </h2>
          <p className="mt-1 text-sm text-brown-soft">
            Cambia el precio de venta o elimina productos del catálogo. Los
            cambios se reflejan en la tienda al instante.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-gold/30 px-3 py-1.5 text-xs font-semibold text-brown-soft hover:bg-cream"
        >
          Refrescar
        </button>
      </div>

      {msg && (
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm text-brown">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-brown-soft">Cargando…</p>
      ) : products.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-gold/40 p-8 text-center text-sm text-brown-soft">
          Sin productos en el catálogo todavía.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-gold/10">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="48px"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brown">
                  {p.name}
                </p>
                <p className="mt-0.5 text-xs text-brown-soft">
                  Costo ${p.costUsd.toFixed(2)} · Ship US $
                  {p.shippingUsUsd.toFixed(2)} · Stock {p.stock} ·{" "}
                  {p.active ? (
                    <span className="text-gold-dark">activo</span>
                  ) : (
                    <span className="text-red-500">inactivo</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder={p.priceUsd.toFixed(2)}
                    value={prices[p.id] ?? ""}
                    onChange={(e) =>
                      setPrices((s) => ({ ...s, [p.id]: e.target.value }))
                    }
                    className="w-24 rounded-xl border border-gold/30 bg-ivory px-2 py-1 text-right text-xs text-brown placeholder-brown-soft/40"
                  />
                  <span className="text-[10px] text-brown-soft">USD</span>
                </div>
                <span className="w-14 text-right text-xs text-brown-soft">
                  act. ${p.priceUsd.toFixed(2)}
                </span>
                <button
                  type="button"
                  disabled={busy === p.id}
                  onClick={() => savePrice(p)}
                  className="inline-flex h-fit items-center gap-1 rounded-full bg-brown px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-gold-dark disabled:opacity-50"
                >
                  <Save size={14} /> Guardar
                </button>
                <button
                  type="button"
                  disabled={busy === p.id}
                  onClick={() => remove(p)}
                  className="inline-flex h-fit items-center gap-1 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
