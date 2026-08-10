import type { StoreSettings } from "./types";

export const settings: StoreSettings = {
  brandName: "Lumaei",
  primaryMarket: "MX",
  secondaryMarket: "US",
  freeShippingMxUsd: 49,
  freeShippingUsd: 49,
  shippingFlatMxUsd: 9.99,
  shippingFlatUsd: 9.99,
  taxRateMx: 0.16,
  taxRateUs: 0.07,
  paymentFeeRate: 0.036,
  autoFulfill: true,
  markup: 2.6,
  minMarginPct: 20,
  /** Tipo de cambio USD→MXN usado para cobrar en pesos en México (OXXO/SPEI). */
  usdToMxn: 17.5,
};
