import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getOrder } from "@/lib/orders-db";
import { createOrderCheckoutSession } from "@/lib/stripe-session";

/** Crea (o reutiliza) sesión Stripe para un pedido pendiente de pago */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe no configurado. Usa modo demo." },
        { status: 400 }
      );
    }

    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (order.status !== "pending_payment") {
      return NextResponse.json({ error: "Este pedido ya no está pendiente" }, { status: 400 });
    }
    if (order.stripeSessionId) {
      // sesión existente: devolver URL si sigue viva
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.url) {
          return NextResponse.json({ checkoutUrl: session.url });
        }
      } catch {
        // seguir y crear nueva
      }
    }

    // Misma construcción que /api/checkout (incluye IVA y descuento):
    // el total cobrado cuadra con order.total y el webhook no bloquea.
    const origin =
      req.headers.get("origin") || "https://www.lumaei.com";
    const session = await createOrderCheckoutSession(order, origin);

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
