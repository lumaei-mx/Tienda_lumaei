import { NextResponse } from "next/server";
import { confirmPaidOrder } from "@/lib/checkout";
import { getStripe, isStripeConfigured, fromStripeAmount } from "@/lib/stripe";
import { getOrder } from "@/lib/orders-db";

// El fulfill CJ (auth + freight + createOrder + payBalance) puede tardar
// 10-30 s con el throttle de CJ. Sin esto Vercel mata la función a los ~10 s
// y el pedido queda pagado sin fulfill. Hobby permite hasta 60 s.
export const maxDuration = 60;

/**
 * Webhook Stripe — única fuente de verdad del pago.
 * - Verifica firma (STRIPE_WEBHOOK_SECRET)
 * - checkout.session.completed → confirmPaidOrder → CJ
 * - payment_intent.payment_failed → marca para revisión
 */
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe no configurado" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Firma/secret faltante" },
      { status: 400 }
    );
  }

  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firma inválida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = String(session.metadata?.orderId || "");
        if (!orderId) break;

        const order = await getOrder(orderId);
        if (!order) break;

        // Guardrail de monto: lo que Stripe cobró debe cuadrar con lo prometido.
        // La sesión ahora SIEMPRE se cobra en USD (order.currency === "USD"),
        // así que amount_total ya viene en dólares: no hay conversión MXN→USD.
        const amountCents = session.amount_total ?? Math.round(order.total * 100);
        let amountPaidUsd = fromStripeAmount(amountCents);
        if (order.currency !== "USD") {
          // legacy / OXXO MXN: normalizar con el rate snapshot de la orden.
          const { readStoreSettings } = await import("@/lib/settings-db");
          const settings = await readStoreSettings();
          const rate = order.rateUsdMxn ?? settings.usdToMxn ?? 17.5;
          amountPaidUsd = fromStripeAmount(amountCents) / rate;
        }

        if (Math.abs(amountPaidUsd - order.total) > 0.5) {
          await import("@/lib/orders-db").then((m) =>
            m.updateOrder(orderId, {
              status: "pending_payment",
              notes: `Monto inesperado: Stripe cobró $${amountPaidUsd.toFixed(
                2
              )} USD vs total esperado $${order.total.toFixed(
                2
              )}. Requiere revisión manual — fulfillment NO disparado.`,
            })
          );
          await import("@/lib/automation/alert").then((m) =>
            m.notifyOwner(
              "amount_mismatch",
              `Pedido ${orderId}: Stripe cobró $${amountPaidUsd.toFixed(
                2
              )} vs esperado $${order.total.toFixed(2)}`,
              "critical"
            )
          );
          break;
        }

        await confirmPaidOrder(orderId, {
          paymentProvider: "stripe",
          paymentRef: session.payment_intent
            ? String(session.payment_intent)
            : session.id,
          amountPaid: amountPaidUsd,
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const orderId = String(pi.metadata?.orderId || "");
        if (!orderId) break;
        await import("@/lib/orders-db").then((m) =>
          m.updateOrder(orderId, {
            status: "pending_payment",
            notes: "Intento de pago fallido con Stripe.",
          })
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = String(session.metadata?.orderId || "");
        if (!orderId) break;
        await import("@/lib/checkout").then((m) =>
          m.cancelPendingOrder(orderId, "Sesión Stripe expirada.")
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
