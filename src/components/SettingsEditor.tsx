"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import type { StoreSettings } from "@/lib/types";

const FIELDS: Array<{
  key: string;
  label: string;
  type?: "number" | "text" | "boolean";
  step?: number;
}> = [
  { key: "brandName", label: "Marca", type: "text" },
  { key: "primaryMarket", label: "Mercado primario", type: "text" },
  { key: "secondaryMarket", label: "Mercado secundario", type: "text" },
  { key: "freeShippingMxUsd", label: "Envío gratis MX (USD)", type: "number", step: 0.01 },
  { key: "freeShippingUsd", label: "Envío gratis US (USD)", type: "number", step: 0.01 },
  { key: "shippingFlatMxUsd", label: "Envío plano MX (USD)", type: "number", step: 0.01 },
  { key: "shippingFlatUsd", label: "Envío plano US (USD)", type: "number", step: 0.01 },
  { key: "taxRateMx", label: "IVA MX (0.16)", type: "number", step: 0.01 },
  { key: "taxRateUs", label: "Tax US (0.07)", type: "number", step: 0.01 },
  { key: "paymentFeeRate", label: "Fee pago (0.036)", type: "number", step: 0.001 },
  { key: "markup", label: "Markup (costo → venta)", type: "number", step: 0.1 },
  { key: "minMarginPct", label: "Margen mínimo %", type: "number" },
  { key: "autoFulfill", label: "Auto-fulfill a CJ", type: "boolean" },
];

export function SettingsEditor() {
  const [s, setS] = useState<StoreSettings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setS(d.settings || null))
      .catch(() => setMsg("Error cargando settings"));
  }, []);

  async function save() {
    if (!s) return;
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg("Guardado ✓");
      setS(d.settings);
    } else {
      setMsg(d.error || "Error");
    }
  }

  if (!s) return <p className="text-sm text-brown-soft">Cargando…</p>;

  return (
    <div className="rounded-2xl border border-gold/20 bg-ivory p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-brown">
          Configuración del negocio
        </h2>
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-2 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory hover:bg-gold-dark"
        >
          <Save size={15} strokeWidth={1.5} /> Guardar
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => {
          const val = (s as unknown as Record<string, unknown>)[f.key];
          if (f.type === "boolean") {
            return (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={(e) =>
                    setS({ ...s, [f.key]: e.target.checked } as StoreSettings)
                  }
                  className="h-4 w-4 accent-brown"
                />
                {f.label}
              </label>
            );
          }
          return (
            <label key={f.key} className="block text-sm">
              <span className="mb-1 block font-medium text-zinc-700">{f.label}</span>
              <input
                type={f.type === "text" ? "text" : "number"}
                step={f.step}
                value={String(val ?? "")}
                onChange={(e) =>
                  setS({
                    ...s,
                    [f.key]: f.type === "text" ? e.target.value : Number(e.target.value),
                  } as StoreSettings)
                }
                className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2 outline-none ring-gold focus:ring-2"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
