import { NextResponse } from "next/server";
import { readStoreSettings } from "@/lib/settings-db";
import type { StoreSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Solo campos necesarios para mostrar precios/envíos/impuestos en el cliente.
 * Nunca: cjApiKey, cjEmail, markup, minMarginPct, paymentFeeRate, autoFulfill.
 */
function publicSettings(s: StoreSettings) {
  return {
    brandName: s.brandName,
    primaryMarket: s.primaryMarket,
    secondaryMarket: s.secondaryMarket,
    freeShippingMxUsd: s.freeShippingMxUsd,
    freeShippingUsd: s.freeShippingUsd,
    freeShippingMinQty: s.freeShippingMinQty,
    shippingFlatMxUsd: s.shippingFlatMxUsd,
    shippingFlatUsd: s.shippingFlatUsd,
    taxRateMx: s.taxRateMx,
    taxRateUs: s.taxRateUs,
  };
}

export async function GET() {
  const s = await readStoreSettings();
  return NextResponse.json({ settings: publicSettings(s) });
}
