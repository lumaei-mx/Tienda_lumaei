"use client";

import { useState } from "react";

export interface AffRow {
  code: string;
  handle: string;
  status: string;
  conversions: number;
  pendingUsd: number;
  paidUsd: number;
  orderCount: number;
  soldUsd: number;
}

export default function AffiliatesCommissions({ rows }: { rows: AffRow[] }) {
  const [data, setData] = useState(rows);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function pay(code: string) {
    setBusy(code);
    setMsg("");
    try {
      const res = await fetch(
        `/api/admin/affiliates/${encodeURIComponent(code)}/pay`,
        { method: "POST" }
      );
      const d = await res.json();
      if (d.ok && d.affiliate) {
        setData((prev) =>
          prev.map((r) =>
            r.code === code
              ? {
                  ...r,
                  pendingUsd: d.affiliate.commissionPendingUsd,
                  paidUsd: d.affiliate.commissionPaidUsd,
                }
              : r
          )
        );
        setMsg(`Comisión de @${d.affiliate.handle} marcada como pagada.`);
      } else {
        setMsg(d.error || "No se pudo marcar.");
      }
    } catch {
      setMsg("Error de red.");
    } finally {
      setBusy(null);
    }
  }

  const totalPending = data.reduce((s, r) => s + r.pendingUsd, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl font-semibold text-brown">
          Comisiones de afiliados
        </h2>
        <span className="text-sm text-brown-soft">
          Pendiente total: <b>${totalPending.toFixed(2)} USD</b>
        </span>
      </div>
      <p className="mt-1 text-xs text-brown-soft">
        Comisión 15% de la ganancia neta por venta. El pago es por transferencia
        manual (fuera de Stripe).
      </p>
      {msg && <p className="mt-2 text-sm text-gold-dark">{msg}</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-gold/20 bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gold/15 bg-cream text-xs uppercase tracking-wider text-brown-soft">
            <tr>
              <th className="px-4 py-3">Afiliado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Conv.</th>
              <th className="px-4 py-3">Vendido USD</th>
              <th className="px-4 py-3">Pendiente</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-brown-soft">
                  Sin afiliados todavía.
                </td>
              </tr>
            )}
            {data.map((r) => (
              <tr key={r.code} className="border-b border-gold/10">
                <td className="px-4 py-3 font-medium text-brown">{r.handle}</td>
                <td className="px-4 py-3 text-xs">
                  {r.status === "active" ? "activo" : "pausado"}
                </td>
                <td className="px-4 py-3">{r.conversions}</td>
                <td className="px-4 py-3">${r.soldUsd.toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold text-gold-dark">
                  ${r.pendingUsd.toFixed(2)}
                </td>
                <td className="px-4 py-3">${r.paidUsd.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button
                    disabled={busy === r.code || r.pendingUsd <= 0}
                    onClick={() => pay(r.code)}
                    className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {busy === r.code ? "..." : "Marcar pagada"}
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
