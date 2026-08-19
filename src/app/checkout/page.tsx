"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { useProducts } from "@/lib/use-products";
import { useStoreSettings } from "@/lib/use-store-settings";
import {
  calcShipping,
  calcTax,
  formatPrice,
  productPrice,
} from "@/lib/money";
import { t } from "@/lib/i18n";
import { productName } from "@/lib/copy";
import { identifyUser, trackInitiateCheckout } from "@/lib/tiktok-pixel";
import { BackButton } from "@/components/BackButton";
import { ShieldCheck, Truck, Lock } from "lucide-react";
import type { Market } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const ref = useCart((s) => s.ref);
  const lang = useCart((s) => s.lang);
  const { byId } = useProducts();
  const { settings } = useStoreSettings();
  const [isStripeMode, setIsStripeMode] = useState(false);

  // El cliente elige su país aquí (ya no hay toggle global de moneda).
  const [country, setCountry] = useState<Market>("MX");
  const market: Market = country;

  // Tipo de cambio en vivo USD→MXN (solo informativo, justo antes de pagar).
  const [fxRate, setFxRate] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/fx")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (typeof d.rate === "number") {
          setFxRate(d.rate);
        }
      })
      .catch(() => {
        if (!cancelled) setFxRate(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setIsStripeMode(Boolean(d.stripe)))
      .catch(() => setIsStripeMode(false));
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  // Stripe regresa a /checkout?cancelado=1 si el comprador cancela el pago.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("cancelado=1")) {
      setCancelled(true);
    }
  }, []);
  const [promoCode, setPromoCode] = useState("");
  const [promoState, setPromoState] = useState<{
    valid: boolean;
    discount: number;
    code: string;
    error?: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });

  const subtotal = useMemo(() => {
    return items.reduce((s, i) => {
      const p = byId(i.productId);
      if (!p) return s;
      return s + productPrice(p) * i.qty;
    }, 0);
  }, [items, byId]);

  const discount = promoState?.valid ? promoState.discount : 0;
  const netSubtotal = Math.max(0, subtotal - discount);
  const totalQty = items.reduce((n, i) => n + i.qty, 0);
  const shippingNet = calcShipping(settings, netSubtotal, market, totalQty);
  const taxNet = calcTax(settings, netSubtotal, shippingNet, market);
  const totalNet = netSubtotal + shippingNet + taxNet;

  // Aviso de arancel: el cálculo usa costUsd SOLO en el servidor
  // (/api/checkout/duty-estimate). El costo jamás viaja al navegador.
  const [showDutyNotice, setShowDutyNotice] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (items.length <= 1) {
      setShowDutyNotice(false);
      return;
    }
    fetch("/api/checkout/duty-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, market }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setShowDutyNotice(Boolean(d.dutyNotice));
      })
      .catch(() => {
        if (!cancelled) setShowDutyNotice(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items, market]);

  // InitiateCheckout (TikTok) al iniciar el checkout con productos en carrito
  useEffect(() => {
    if (items.length === 0) return;
    const contents: Array<{
      id: string;
      name: string;
      category: string;
      priceUsd: number;
      quantity: number;
    }> = [];
    for (const i of items) {
      const p = byId(i.productId);
      if (!p) continue;
      contents.push({
        id: p.id,
        name: p.name,
        category: p.category,
        priceUsd: productPrice(p),
        quantity: i.qty,
      });
    }
    if (contents.length === 0) return;
    trackInitiateCheckout(contents, totalNet);
  }, [items, byId, totalNet]);

  async function applyPromo() {
    setError("");
    const res = await fetch("/api/promos/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, market, subtotal }),
    });
    const d = await res.json();
    if (d.valid) {
      setPromoState({ valid: true, discount: d.discount, code: d.code });
    } else {
      setPromoState({ valid: false, discount: 0, code: "", error: d.error });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      identifyUser({ email: form.email, phone: form.phone });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          market,
          lang,
          // Ref de afiliado capturado en el carrito (PDP ?ref=). undefined si no
          // hubo ref → el servidor NO persiste el campo (C4).
          ref: ref ?? undefined,
          promoCode: promoState?.valid ? promoState.code : undefined,
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          shippingAddress: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: market,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      // El carrito NO se vacía aquí: se limpia en /pedido cuando el pago se
      // confirma. Si el cliente cancela en Stripe, conserva sus productos.
      if (data.provider === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/pedido/${data.orderId}?key=${data.key}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("paymentError", lang));
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="font-semibold">{t("noItems", lang)}</p>
      </div>
    );
  }

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        required={key !== "line2"}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl border border-gold/30 bg-ivory px-3 py-2.5 outline-none ring-gold focus:ring-2"
      />
    </label>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gold/20 bg-ivory p-6">
        <div className="flex items-center gap-4">
          <BackButton href="/carrito" />
          <h1 className="font-serif text-3xl font-semibold text-brown">
            {t("checkoutTitle", lang)}
          </h1>
        </div>
        <p className="text-sm text-brown-soft">
          {isStripeMode ? t("stripeRedirect", lang) : t("demoMode", lang)}
        </p>

        {cancelled && (
          <p className="rounded-xl border border-gold/40 bg-cream px-3 py-2 text-sm text-brown">
            {t("paymentCancelled", lang)}
          </p>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">
            {t("countryLabel", lang)}
          </span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Market)}
            className="w-full rounded-xl border border-gold/30 bg-ivory px-3 py-2.5 outline-none ring-gold focus:ring-2"
          >
            <option value="MX">{t("countryMx", lang)}</option>
            <option value="US">{t("countryUs", lang)}</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", t("formName", lang))}
          {field("email", t("formEmail", lang), "email")}
          {field("phone", t("formPhone", lang), "tel")}
          {field("line1", t("formLine1", lang))}
          {field("line2", t("formLine2", lang))}
          {field("city", t("formCity", lang))}
          {field(
            "state",
            market === "MX" ? t("formState", lang) : t("formStateUs", lang)
          )}
          {field(
            "zip",
            market === "MX" ? t("formZip", lang) : t("formZipUs", lang)
          )}
        </div>

        {showDutyNotice && (
          <p className="rounded-xl border border-gold/40 bg-cream px-3 py-2 text-xs text-brown">
            <strong>{t("dutyNoticeTitle", lang)}:</strong>{" "}
            {t("dutyNotice", lang)}
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brown py-3 text-sm font-semibold tracking-wide text-ivory hover:bg-gold-dark disabled:opacity-60"
        >
          {loading
            ? t("payProcessing", lang)
            : `${t("payNow", lang)} ${formatPrice(totalNet, lang)}`}
        </button>
        {market === "MX" && fxRate !== null && !loading && (
          <p className="text-center text-xs text-brown-soft">
            {t("approxInMxn", lang)}{" "}
            <span className="font-semibold text-brown">
              ${(totalNet * fxRate).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}{" "}
              MXN
            </span>{" "}
            · {t("fxRateLabel", lang)} 1 USD = ${fxRate.toFixed(2)} MXN
          </p>
        )}
        <ul className="mt-3 space-y-1.5 text-[11px] text-brown-soft">
          <li className="flex items-center gap-2">
            <ShieldCheck size={13} className="shrink-0 text-gold-dark" strokeWidth={1.8} />
            {t("checkoutTrustG", lang)}
          </li>
          <li className="flex items-center gap-2">
            <Truck size={13} className="shrink-0 text-gold-dark" strokeWidth={1.8} />
            {t("checkoutTrustS", lang)}
          </li>
          <li className="flex items-center gap-2">
            <Lock size={13} className="shrink-0 text-gold-dark" strokeWidth={1.8} />
            {t("checkoutTrustP", lang)}
          </li>
        </ul>
      </form>

      <aside className="h-fit rounded-2xl border border-gold/20 bg-ivory p-5 text-sm">
        <h2 className="font-serif text-xl font-semibold">{t("yourOrder", lang)}</h2>
        <ul className="mt-3 space-y-2">
          {items.map((i) => {
            const p = byId(i.productId);
            if (!p) return null;
            return (
              <li key={i.productId} className="flex justify-between gap-2">
                <span className="text-brown-soft">
                  {productName(p, lang)} × {i.qty}
                </span>
                <span>{formatPrice(productPrice(p) * i.qty, lang)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 space-y-1 border-t border-gold/20 pt-3">
          <div className="flex justify-between">
            <span>{t("subtotal", lang)}</span>
            <span>{formatPrice(subtotal, lang)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gold-dark">
              <span>{t("discount", lang)} ({promoState?.code})</span>
              <span>-{formatPrice(discount, lang)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t("shipping", lang)}</span>
            <span>
              {shippingNet === 0 ? t("free", lang) : formatPrice(shippingNet, lang)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("iva", lang)}</span>
            <span>{formatPrice(taxNet, lang)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>{t("total", lang)}</span>
            <span>{formatPrice(totalNet, lang)}</span>
          </div>
          {market === "MX" && fxRate !== null && (
            <div className="mt-2 rounded-xl border border-gold/40 bg-cream px-3 py-2">
              <p className="flex justify-between text-xs text-brown">
                <span>{t("approxInMxn", lang)}</span>
                <span className="font-semibold">
                  ${(totalNet * fxRate).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  MXN
                </span>
              </p>
              <p className="mt-1 text-[10px] text-brown-soft">
                {t("fxRateLabel", lang)}: 1 USD = ${fxRate.toFixed(2)} MXN
              </p>
            </div>
          )}
          {market === "MX" && fxRate === null && (
            <p className="mt-2 text-[10px] text-brown-soft">
              {t("fxRateFallback", lang)}
            </p>
          )}
        </div>
        <div className="mt-4 border-t border-gold/20 pt-3">
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoState(null);
              }}
              placeholder={t("promoCode", lang)}
              className="w-full rounded-lg border border-gold/30 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2"
            />
            <button
              type="button"
              onClick={applyPromo}
              className="shrink-0 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-ivory hover:bg-gold-dark"
            >
              {t("apply", lang)}
            </button>
          </div>
          {!promoState?.valid && (
            <p className="mt-2 text-[11px] text-gold-dark">{t("promoHint", lang)}</p>
          )}
          {promoState?.valid && (
            <p className="mt-2 text-xs font-medium text-gold-dark">
              −{formatPrice(promoState.discount, lang)} ({promoState.code})
            </p>
          )}
          {promoState?.error && (
            <p className="mt-2 text-xs text-red-700">{promoState.error}</p>
          )}
          {(settings.freeShippingMinQty || 0) > 0 &&
            totalQty < settings.freeShippingMinQty && (
              <p className="mt-2 text-[11px] text-brown-soft">
                {t("cartFreeShipNeed", lang).replace(
                  "{n}",
                  String(settings.freeShippingMinQty - totalQty)
                )}
              </p>
            )}
          {(settings.freeShippingMinQty || 0) > 0 &&
            totalQty >= settings.freeShippingMinQty && (
              <p className="mt-2 text-[11px] font-medium text-gold-dark">
                {t("cartFreeShipUnlocked", lang)}
              </p>
            )}
        </div>
      </aside>
    </div>
  );
}
