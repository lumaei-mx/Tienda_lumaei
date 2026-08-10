import { NextResponse } from "next/server";
import { createPendingOrder } from "@/lib/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { localizeCheckoutError } from "@/lib/checkout-errors";
import type { Address, CartItem, Customer, Market } from "@/lib/types";

export async function POST(req: Request) {
  let lang: "es" | "en" = "es";
  try {
    const body = await req.json();
    const items = body.items as CartItem[];
    const market = (body.market || "MX") as Market;
    const customer = body.customer as Customer;
    const shippingAddress = body.shippingAddress as Address;
    lang = body.lang === "en" ? "en" : "es";

    if (!items?.length || !customer?.email || !shippingAddress?.line1) {
      return NextResponse.json(
        { error: lang === "en" ? "Incomplete information" : "Datos incompletos" },
        { status: 400 }
      );
    }

    const order = await createPendingOrder({
      items,
      market,
      customer,
      shippingAddress,
      promoCode: typeof body.promoCode === "string" ? body.promoCode : undefined,
    });

    // Stripe real
    if (isStripeConfigured()) {
      // La sesión SIEMPRE se crea en USD con IVA y descuento incluidos
      // (buildOrderLineItems). La conversión a MXN la hace el banco del
      // cliente al momento del pago.
      const origin =
        req.headers.get("origin") || "https://www.lumaei.com";
      const { createOrderCheckoutSession } = await import("@/lib/stripe-session");
      const session = await createOrderCheckoutSession(order, origin);

      return NextResponse.json({
        orderId: order.id,
        provider: "stripe" as const,
        checkoutUrl: session.url,
      });
    }

    // Demo: confirmamos directo (sin cobro)
    const { confirmPaidOrder } = await import("@/lib/checkout");
    const paid = await confirmPaidOrder(order.id, {
      paymentProvider: "demo",
      paymentRef: `DEMO-${Date.now()}`,
    });

    return NextResponse.json({
      orderId: paid.id,
      provider: "demo" as const,
      key: paid.accessToken,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Error de checkout";
    return NextResponse.json(
      { error: localizeCheckoutError(raw, lang) },
      { status: 400 }
    );
  }
}
