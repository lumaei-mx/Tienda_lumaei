"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export function PayNowButton({ orderId }: { orderId: string }) {
  const lang = useCart((s) => s.lang);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-brown hover:bg-gold-dark hover:text-ivory disabled:opacity-60"
      >
        {busy ? t("payOpening", lang) : t("payNow2", lang)}
      </button>
      {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
    </div>
  );
}
