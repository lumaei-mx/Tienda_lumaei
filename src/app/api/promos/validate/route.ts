import { NextResponse } from "next/server";
import { validatePromo } from "@/lib/promo-db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = String(body?.code || "").trim();
  const market = body?.market === "US" ? "US" : "MX";
  const subtotal = Number(body?.subtotal);
  if (!code || !Number.isFinite(subtotal)) {
    return NextResponse.json({ error: "Código o subtotal inválidos" }, { status: 400 });
  }
  const result = await validatePromo(code, market, subtotal);
  if (!result) {
    return NextResponse.json({ valid: false, error: "Código no válido o vencido" });
  }
  return NextResponse.json({ valid: true, discount: result.discount, code: result.promo.code });
}
