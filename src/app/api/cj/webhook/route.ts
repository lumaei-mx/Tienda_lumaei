import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { readOrders, saveOrder } from "@/lib/orders-db";

/**
 * Webhook para actualizaciones de CJ (tracking / estado).
 * Configura la URL en el panel de CJ apuntando a /api/cj/webhook.
 *
 * Seguridad (fail-closed): CJ_WEBHOOK_SECRET es OBLIGATORIO. Si no está
 * definido, el webhook rechaza con 503 — nunca acepta peticiones sin
 * verificar el header x-cj-webhook-secret (comparación timing-safe).
 */
export async function POST(req: Request) {
  const secret = process.env.CJ_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CJ_WEBHOOK_SECRET no configurado; webhook deshabilitado" },
      { status: 503 }
    );
  }
  const provided = req.headers.get("x-cj-webhook-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const cjOrderId = String(
      body.orderId || body.cjOrderId || body.data?.orderId || ""
    );
    const trackingNumber =
      body.trackingNumber || body.data?.trackingNumber || undefined;
    const carrier = body.logisticName || body.data?.logisticName || "CJPacket";
    const statusRaw = String(body.status || body.data?.status || "").toLowerCase();

    if (!cjOrderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const orders = await readOrders();
    // Matchea por cualquiera de los IDs que CJ pueda mandar: orderCode SD...
    // o shipmentOrderId real CJ2608...
    const order = orders.find(
      (o) => o.cjOrderId === cjOrderId || o.cjOrderRealId === cjOrderId
    );
    if (!order) {
      return NextResponse.json({ ok: true, matched: false });
    }

    let status = order.status;
    // Nunca retroceder desde estados terminales.
    if (order.status !== "delivered" && order.status !== "cancelled") {
      if (statusRaw.includes("deliver")) status = "delivered";
      else if (trackingNumber || statusRaw.includes("ship")) status = "shipped";
    }

    const updated = {
      ...order,
      status,
      trackingNumber: trackingNumber || order.trackingNumber,
      trackingCarrier: carrier,
      updatedAt: new Date().toISOString(),
    };
    await saveOrder(updated);

    return NextResponse.json({ ok: true, matched: true, orderId: order.id });
  } catch {
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }
}
