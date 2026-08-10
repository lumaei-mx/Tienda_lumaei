"use client";

import { Truck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export function FreeShippingBar({
  freeMx,
  freeUs,
}: {
  freeMx: number;
  freeUs: number;
}) {
  const lang = useCart((s) => s.lang);
  return (
    <div className="bg-brown px-4 py-2 text-center text-xs font-medium tracking-wide text-ivory">
      <span className="inline-flex items-center gap-2">
        <Truck size={14} strokeWidth={1.5} />
        {t("freeShipBar", lang)
          .replace("{mx}", formatMoney(freeMx))
          .replace("{us}", formatMoney(freeUs))}
      </span>
    </div>
  );
}
