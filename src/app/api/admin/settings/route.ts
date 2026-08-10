import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readStoreSettings, updateStoreSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";

const NUMERIC_KEYS = [
  "freeShippingMxUsd",
  "freeShippingUsd",
  "shippingFlatMxUsd",
  "shippingFlatUsd",
  "taxRateMx",
  "taxRateUs",
  "paymentFeeRate",
  "markup",
  "minMarginPct",
] as const;

// Umbrales que NUNCA deben ser <= 0 (pe. freeShipping=0 → envío gratis universal).
const POSITIVE_KEYS = new Set<string>([
  "freeShippingMxUsd",
  "freeShippingUsd",
  "shippingFlatMxUsd",
  "shippingFlatUsd",
  "markup",
  "minMarginPct",
]);

// Rangos sanos para tasas (0-1) y multiplicadores.
const RANGES: Record<string, [number, number]> = {
  taxRateMx: [0, 0.5],
  taxRateUs: [0, 0.5],
  paymentFeeRate: [0, 0.2],
  markup: [1, 10],
  minMarginPct: [0, 90],
};

const BOOL_KEYS = ["autoFulfill"] as const;

const STRING_KEYS = ["brandName", "primaryMarket", "secondaryMarket"] as const;

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const s = await readStoreSettings();
  return NextResponse.json({ settings: s });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const k of NUMERIC_KEYS) {
    if (k in body) {
      const v = Number(body[k]);
      if (!Number.isFinite(v)) {
        return NextResponse.json(
          { error: `${k} debe ser numérico` },
          { status: 400 }
        );
      }
      if (POSITIVE_KEYS.has(k) && v <= 0) {
        return NextResponse.json(
          { error: `${k} debe ser mayor a 0` },
          { status: 400 }
        );
      }
      const range = RANGES[k];
      if (range && (v < range[0] || v > range[1])) {
        return NextResponse.json(
          { error: `${k} fuera de rango (${range[0]}-${range[1]})` },
          { status: 400 }
        );
      }
      patch[k] = v;
    }
  }
  for (const k of BOOL_KEYS) {
    if (k in body) patch[k] = Boolean(body[k]);
  }
  for (const k of STRING_KEYS) {
    if (k in body && typeof body[k] === "string") {
      if (k === "primaryMarket" || k === "secondaryMarket") {
        const v = body[k] as string;
        if (v !== "MX" && v !== "US") {
          return NextResponse.json(
            { error: `${k} debe ser MX o US` },
            { status: 400 }
          );
        }
      }
      patch[k] = body[k] as string;
    }
  }

  const next = await updateStoreSettings(patch);
  return NextResponse.json({ settings: next });
}
