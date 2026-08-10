import { NextResponse } from "next/server";
import { getProductByIdAsync } from "@/lib/products-db";
import type { CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Estima si un pedido MX puede generar aranceles al destinatario.
 * El cálculo usa costUsd INTERNAMENTE (server-side) pero solo expone
 * un booleano: el costo de los productos NUNCA viaja al navegador.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = (body.items || []) as CartItem[];
    const market = body.market || "MX";

    if (market !== "MX" || items.length <= 1) {
      return NextResponse.json({ dutyNotice: false });
    }

    let declaredUsd = 0;
    for (const line of items) {
      const p = await getProductByIdAsync(line.productId);
      if (p) declaredUsd += p.costUsd * line.qty;
    }

    return NextResponse.json({ dutyNotice: declaredUsd > 50 });
  } catch {
    return NextResponse.json({ dutyNotice: false });
  }
}
