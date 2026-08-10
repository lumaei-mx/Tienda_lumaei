"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Promo } from "@/lib/promo-db";

const EMPTY: Omit<Promo, "code" | "createdAt" | "updatedAt" | "usedCount"> & { code: string } = {
  code: "",
  type: "percent",
  value: 10,
  markets: ["MX", "US"],
  active: true,
};

export function PromosPanel() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, value: 10 });

  async function load() {
    const res = await fetch("/api/admin/promos");
    const d = await res.json();
    setPromos(d.promos || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("Error cargando promos"));
  }, []);

  async function create() {
    setMsg("");
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg(`Promo ${d.promo.code} creada ✓`);
      setShowForm(false);
      setForm({ ...EMPTY, value: 10 });
      load();
    } else {
      setMsg(d.error || "Error");
    }
  }

  async function remove(code: string) {
    const res = await fetch(`/api/admin/promos?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-brown">Promociones</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory hover:bg-gold-dark"
        >
          <Plus size={15} /> Nueva promo
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}

      {showForm && (
        <div className="mt-4 grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Código</span>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full rounded-lg border border-gold/30 bg-white px-3 py-2 outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Tipo</span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as Promo["type"] })
              }
              className="w-full rounded-lg border border-gold/30 bg-white px-3 py-2 outline-none"
            >
              <option value="percent">% descuento</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">
              {form.type === "percent" ? "% (1–100)" : "Monto en moneda del mercado"}
            </span>
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              className="w-full rounded-lg border border-gold/30 bg-white px-3 py-2 outline-none"
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Mercados</span>
              <select
                multiple
                value={form.markets}
                onChange={(e) =>
                  setForm({
                    ...form,
                    markets: Array.from(e.target.selectedOptions, (o) => o.value as "MX" | "US"),
                  })
                }
                className="w-full rounded-lg border border-gold/30 bg-white px-3 py-2 outline-none"
              >
                <option value="MX">MX</option>
                <option value="US">US</option>
              </select>
            </label>
            <button
              type="button"
              onClick={create}
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-brown hover:bg-gold-dark"
            >
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gold/15 bg-cream text-xs uppercase tracking-wider text-brown-soft">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Valor</th>
              <th className="px-4 py-2">Mercados</th>
              <th className="px-4 py-2">Usos</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-brown-soft">
                  Sin promos todavía.
                </td>
              </tr>
            )}
            {promos.map((p) => (
              <tr key={p.code} className="border-b border-gold/10">
                <td className="px-4 py-2 font-semibold text-brown">{p.code}</td>
                <td className="px-4 py-2">
                  {p.type === "percent" ? `${p.value}%` : `$${p.value}`}
                </td>
                <td className="px-4 py-2">{p.markets.join(", ")}</td>
                <td className="px-4 py-2">
                  {p.usedCount}
                  {p.usageLimit !== undefined ? `/${p.usageLimit}` : ""}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.active ? "bg-gold/20 text-gold-dark" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {p.active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => remove(p.code)}
                    className="text-brown-soft/50 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
