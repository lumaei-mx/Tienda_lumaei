"use client";

import { Lock, RotateCcw, Truck, Headphones } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { t, type DictKey } from "@/lib/i18n";

const BADGES: Array<{ icon: typeof Lock; title: DictKey; text: DictKey }> = [
  {
    icon: Lock,
    title: "trustPayT",
    text: "trustPayD",
  },
  {
    icon: Truck,
    title: "trustShipT",
    text: "trustShipD",
  },
  {
    icon: RotateCcw,
    title: "trustReturnT",
    text: "trustReturnD",
  },
  {
    icon: Headphones,
    title: "trustSupportT",
    text: "trustSupportD",
  },
];

export function TrustBadges() {
  const lang = useCart((s) => s.lang);
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {BADGES.map((b) => (
        <div
          key={b.title}
          className="flex items-start gap-3 rounded-xl border border-gold/20 bg-ivory p-3"
        >
          <b.icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-dark" />
          <div>
            <p className="text-sm font-semibold text-brown">{t(b.title, lang)}</p>
            <p className="text-xs text-brown-soft">{t(b.text, lang)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
