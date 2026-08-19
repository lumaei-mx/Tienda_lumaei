import { storageGet, storageSet, storageList } from "./storage";

const COL = "affiliates";
export const DEFAULT_COMMISSION_RATE = 0.15; // 15% del profit neto del pedido (ver docs/panel-ganancias-14-ago.md)

export interface Affiliate {
  code: string;
  handle: string;
  name: string;
  email: string;
  commissionRate: number;
  createdAt: string;
  status: "active" | "paused";
  clicks: number;
  conversions: number;
  commissionPendingUsd: number;
  commissionPaidUsd: number;
}

export function affiliateCodeFromRef(ref?: string): string | null {
  if (!ref) return null;
  const s = ref.trim().replace(/^@/, "").toLowerCase();
  return s || null;
}

export async function getAffiliate(code: string): Promise<Affiliate | null> {
  const c = affiliateCodeFromRef(code) ?? code;
  return storageGet<Affiliate>(COL, c);
}

export async function listAffiliates(): Promise<Affiliate[]> {
  return storageList<Affiliate>(COL);
}

export async function createAffiliate(input: {
  code: string;
  handle?: string;
  name: string;
  email: string;
  commissionRate?: number;
}): Promise<Affiliate> {
  const code = affiliateCodeFromRef(input.code);
  if (!code) throw new Error("Código de afiliado inválido");
  const existing = await getAffiliate(code);
  if (existing) return existing;
  const aff: Affiliate = {
    code,
    handle: input.handle?.trim() || `@${code}`,
    name: input.name.trim(),
    email: input.email.trim(),
    commissionRate: input.commissionRate ?? DEFAULT_COMMISSION_RATE,
    createdAt: new Date().toISOString(),
    status: "active",
    clicks: 0,
    conversions: 0,
    commissionPendingUsd: 0,
    commissionPaidUsd: 0,
  };
  await storageSet(COL, code, aff);
  return aff;
}

// Se paga SOLO cuando hay venta real: comisión = profit neto * tasa.
// $0 costo fijo para nosotros; la comisión sale de la ganancia del pedido.
// Si el afiliado no existe aún (influencer cuyo link generó la venta pero no
// se dio de alta), se auto-provisiona para que SIEMPRE se le acredite y pueda
// cobrar. Operación 100% autónoma, sin intervención humana.
export async function creditAffiliateConversion(
  code: string,
  profitUsd: number
): Promise<void> {
  let aff = await getAffiliate(code);
  if (!aff) {
    const c = affiliateCodeFromRef(code);
    if (!c) return;
    aff = await createAffiliate({
      code: c,
      name: c,
      email: `${c}@lumaei-affiliate.local`,
    });
  }
  if (aff.status !== "active") return;
  const amount = Math.max(0, profitUsd) * aff.commissionRate;
  aff.conversions += 1;
  aff.commissionPendingUsd = Number(
    (aff.commissionPendingUsd + amount).toFixed(2)
  );
  await storageSet(COL, aff.code, aff);
}

export async function markCommissionPaid(code: string): Promise<void> {
  const aff = await getAffiliate(code);
  if (!aff) return;
  aff.commissionPaidUsd = Number(
    (aff.commissionPaidUsd + aff.commissionPendingUsd).toFixed(2)
  );
  aff.commissionPendingUsd = 0;
  await storageSet(COL, aff.code, aff);
}

export function referralLinkFor(handle: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";
  return `${base}/productos?ref=${encodeURIComponent(handle)}`;
}
