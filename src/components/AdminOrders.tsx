"use client";

import Link from "next/link";
import { useState } from "react";
import type { Order } from "@/lib/types";
import { formatMoney } from "@/lib/money";

export function AdminOrders({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busy, setBusy] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ id: string; text: string } | null>(
    null
  );

  async function fulfill(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/orders/${id}/fulfill`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
      } else {
        alert(data.error || "Error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function resendEmail(id: string) {
    setBusy(id);
    setEmailMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}/resend-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMsg({ id, text: "Email reenviado ✓" });
      } else {
        setEmailMsg({ id, text: data.error || "Error" });
      }
    } finally {
      setBusy(null);
    }
  }

  if (orders.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-ivory p-8 text-center text-sm text-brown-soft">
        Aún no hay pedidos. Haz una compra desde el checkout.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-gold/30 bg-ivory px-3 py-1 text-xs font-semibold text-brown hover:bg-cream"
        >
          ↻ Actualizar
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gold/20 bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gold/15 bg-cream text-xs uppercase tracking-wider text-brown-soft">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Mercado</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Profit USD</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">CJ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gold/10">
                <td className="whitespace-nowrap px-4 py-3 text-brown-soft">
                  {new Date(o.createdAt).toLocaleString("es-MX")}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-brown">{o.customer.name}</div>
                  <div className="text-xs text-brown-soft">{o.customer.email}</div>
                </td>
                <td className="px-4 py-3">{o.market}</td>
                <td className="px-4 py-3">{formatMoney(o.total)}</td>
                <td className="px-4 py-3 text-gold-dark">
                  ${o.estimatedProfitUsd.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-medium">
                    {o.status}
                  </span>
                  {o.trackingNumber && (
                    <div className="mt-1 text-[10px] text-brown-soft">
                      {o.trackingNumber}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-brown-soft">
                  {o.cjOrderId || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/pedido/${o.id}`}
                      className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown hover:bg-cream"
                    >
                      Ver
                    </Link>
                    <button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => resendEmail(o.id)}
                      title="Reenviar email de confirmación al cliente"
                      className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-brown-soft hover:bg-cream disabled:opacity-50"
                    >
                      ✉
                    </button>
                    {["paid", "fulfillment_queued"].includes(o.status) && (
                      <button
                        type="button"
                        disabled={busy === o.id}
                        onClick={() => fulfill(o.id)}
                        className="rounded-full bg-brown px-3 py-1 text-xs font-semibold text-ivory disabled:opacity-50"
                      >
                        {busy === o.id ? "..." : "Fulfill CJ"}
                      </button>
                    )}
                    {emailMsg?.id === o.id && (
                      <span className="text-[11px] text-brown-soft">{emailMsg.text}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
