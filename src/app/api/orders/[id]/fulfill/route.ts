import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/cj";
import { getOrder, saveOrder } from "@/lib/orders-db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.status === "sent_to_cj" || order.status === "shipped") {
    return NextResponse.json({ order, message: "Ya enviado a CJ" });
  }

  // Solo se fulfillan pedidos PAGADOS (o en cola de fulfill). Con
  // CJ_AUTO_PAY_BALANCE=true un fulfill crea y PAGA una orden CJ real:
  // nunca debe dispararse sobre pedidos pendientes/cancelados.
  if (order.status !== "paid" && order.status !== "fulfillment_queued") {
    return NextResponse.json(
      { error: "Solo se pueden fulfill pedidos pagados" },
      { status: 403 }
    );
  }

  try {
    const fulfilled = await fulfillOrder(order);
    await saveOrder(fulfilled);
    return NextResponse.json({ order: fulfilled });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error CJ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
