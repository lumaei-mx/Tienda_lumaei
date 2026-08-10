import { randomUUID, randomBytes } from "crypto";
import { getProductByIdAsync } from "./products-db";
import { readStoreSettings } from "./settings-db";
import {
  calcShipping,
  calcTax,
  productPrice,
} from "./money";
import { throwCheckoutError } from "./checkout-errors";
import type {
  Address,
  CartItem,
  Customer,
  Market,
  Order,
  OrderItem,
} from "./types";
import { fulfillOrder, isCjBalanceError } from "./cj";
import { getOrder, saveOrder, updateOrder } from "./orders-db";
import { enqueueRetry } from "./automation/queue";
import { notifyOwner } from "./automation/alert";
import { incrementPromoUsage, validatePromo } from "./promo-db";
import { trackOrderPaid } from "./tiktok-events";
import { sendOrderConfirmation } from "./email";

export interface CheckoutInput {
  items: CartItem[];
  market: Market;
  customer: Customer;
  shippingAddress: Address;
  promoCode?: string;
}

/**
 * Fase 1 — crea el pedido en estado pending_payment.
 * No toca CJ. El fulfill SOLO ocurre tras pago verificado.
 */
export async function createPendingOrder(input: CheckoutInput): Promise<Order> {
  const { market, customer } = input;
  const currency = "USD";
  const s = await readStoreSettings();
  const orderItems: OrderItem[] = [];

  for (const line of input.items) {
    const product = await getProductByIdAsync(line.productId);
    if (!product) throwCheckoutError("CHECKOUT:PRODUCT_NOT_FOUND", line.productId);
    if (product.stock < line.qty) {
      throwCheckoutError("CHECKOUT:INSUFFICIENT_STOCK", product.name);
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      qty: line.qty,
      unitPrice: productPrice(product),
      cjSku: product.cjSku,
      cjVariantId: product.cjVariantId || product.cjSku,
      costUsd: product.costUsd,
    });
  }

  if (orderItems.length === 0) throwCheckoutError("CHECKOUT:EMPTY_CART");

  const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  // promo aplicada sobre subtotal (antes de envío/impuesto)
  let discount = 0;
  let promoCode: string | undefined;
  if (input.promoCode) {
    const promo = await validatePromo(input.promoCode, market, subtotal);
    if (promo) {
      discount = promo.discount;
      promoCode = promo.promo.code;
    }
  }
  const netSubtotal = Math.max(0, subtotal - discount);

  const shipping = calcShipping(s, netSubtotal, market);
  const tax = calcTax(s, netSubtotal, shipping, market);
  const total = Number((netSubtotal + shipping + tax).toFixed(2));

  let cogsUsd = 0;
  let shippingCostUsd = 0;
  for (const line of input.items) {
    const p = await getProductByIdAsync(line.productId);
    if (!p) continue;
    cogsUsd += p.costUsd * line.qty;
    shippingCostUsd +=
      (market === "MX" ? p.shippingMxUsd : p.shippingUsUsd) * line.qty;
  }

  const totalUsd = total;
  const paymentFeeUsd = Number((totalUsd * s.paymentFeeRate).toFixed(2));
  // Profit real: NO cuenta el IVA/tax como ingreso (el impuesto se retiene para declarar).
  const estimatedProfitUsd = Number(
    (totalUsd - tax - cogsUsd - shippingCostUsd - paymentFeeUsd).toFixed(2)
  );

  // consumo de la promo cuando se confirma el pago (en confirmPaidOrder)
  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "pending_payment",
    market,
    currency,
    customer,
    shippingAddress: { ...input.shippingAddress, country: market },
    items: orderItems,
    subtotal,
    discount: discount > 0 ? discount : undefined,
    promoCode,
    shipping,
    tax,
    total,
    cogsUsd,
    shippingCostUsd,
    paymentFeeUsd,
    estimatedProfitUsd,
    // snapshot del tipo de cambio: el webhook normaliza MXN→USD con este rate,
    // no con el rate vivo (pago OXXO puede ocurrir días después).
    rateUsdMxn: s.usdToMxn,
    autoFulfilled: false,
    accessToken: randomBytes(16).toString("hex"),
  };

  await saveOrder(order);
  return order;
}

/**
 * Fase 2 — pago verificado (webhook Stripe / pago demo).
 * Aquí sí se dispara el auto-fulfill a CJ.
 */
export async function confirmPaidOrder(
  orderId: string,
  opts?: {
    paymentProvider?: "stripe" | "demo";
    paymentRef?: string;
    amountPaid?: number;
  }
): Promise<Order> {
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido no encontrado");

  // idempotencia: ya pagado/fulfilled — no duplicar (webhook Stripe reenvía hasta 3x)
  if (order.status !== "pending_payment") {
    return order;
  }

  const storeSettings = await readStoreSettings();
  const now = new Date().toISOString();

  // Conversión TikTok (server-side, fire-and-forget) — solo una vez por pedido.
  trackOrderPaid({ ...order, status: "paid" as const });

  let updated: Order = {
    ...order,
    status: "paid",
    paymentProvider: opts?.paymentProvider || "demo",
    paymentRef: opts?.paymentRef || order.paymentRef,
    updatedAt: now,
  };
  if (order.promoCode) {
    await incrementPromoUsage(order.promoCode).catch(() => {});
  }
  await saveOrder(updated);

  await notifyOwner(
    "order_paid",
    `Nuevo pedido pagado (${updated.market}): $${updated.total.toFixed(
      2
    )} USD · ${updated.customer.name} <${updated.customer.email}> · ${
      updated.items.length
    } item(s).`,
    "info"
  ).catch(() => {});

  // Email de confirmación al cliente — se dispara EN PARALELO con el fulfill
  // para no bloquear el webhook; el resultado se persiste en la orden abajo.
  type EmailResult = { ok: boolean; skipped?: boolean; error?: string };
  const emailPromise: Promise<EmailResult> = sendOrderConfirmation(updated)
    .catch((err): EmailResult => ({
      ok: false,
      error: err instanceof Error ? err.message : "error enviando email",
    }));

  // solo tras pago verificado → CJ
  if (storeSettings.autoFulfill) {
    // Estado intermedio persistente ANTES de tocar CJ: si el proceso muere a
    // mitad del fulfill (timeout), el cron retry-fulfill retoma el pedido.
    updated = {
      ...updated,
      status: "fulfillment_queued",
      updatedAt: new Date().toISOString(),
    };
    await saveOrder(updated);
    try {
      updated = await fulfillOrder(updated);
      await saveOrder(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      const isBalance = isCjBalanceError(msg);
      updated = {
        ...updated,
        status: "fulfillment_queued",
        notes: `Auto-fulfill falló: ${msg}${
          isBalance
            ? ". Balance CJ insuficiente — fondear la cuenta CJ y reintentar manualmente."
            : ". En cola de reintento automático."
        }`,
        updatedAt: new Date().toISOString(),
      };
      await saveOrder(updated);
      if (isBalance) {
        // Un balance insuficiente NO se cura reintentando: solo fondear la
        // cuenta CJ. Alerta crítica accionable, sin cola de reintento ciego.
        await notifyOwner(
          "cj_balance_insufficient",
          `Pedido ${orderId}: balance CJ insuficiente. Fondear la cuenta CJ y reintentar manualmente.`,
          "critical"
        ).catch(() => {});
      } else {
        await enqueueRetry(orderId, msg);
        await notifyOwner("fulfill_failed", `Pedido ${orderId}: ${msg}`, "warn");
      }
    }
  } else {
    updated = {
      ...updated,
      status: "fulfillment_queued",
      updatedAt: new Date().toISOString(),
    };
    await saveOrder(updated);
  }

  // Cierre del email: persiste el resultado real en la orden y alerta al owner
  // cuando NO se envió. El estado "sent" no alerta (es el comportamiento esperado).
  const emailResult = await emailPromise;
  const emailStatus: Order["emailStatus"] = emailResult.skipped
    ? "skipped"
    : emailResult.ok
      ? "sent"
      : "error";
  updated = {
    ...updated,
    emailStatus,
    emailError: emailResult.ok || emailResult.skipped ? undefined : emailResult.error,
  };
  await saveOrder(updated);

  if (emailResult.skipped) {
    await notifyOwner(
      "email_not_configured",
      `Pedido ${orderId}: el email de confirmación NO se envió (falta GMAIL_APP_PASSWORD). Activarlo en Fase 2.`,
      "warn"
    ).catch(() => {});
  } else if (!emailResult.ok) {
    await notifyOwner(
      "email_failed",
      `Pedido ${orderId}: falló el email de confirmación (${emailResult.error}). Reenviar desde admin.`,
      "warn"
    ).catch(() => {});
  }

  return updated;
}

export async function cancelPendingOrder(orderId: string, reason?: string) {
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido no encontrado");
  if (order.status !== "pending_payment") return order;
  return updateOrder(orderId, {
    status: "cancelled",
    notes: reason || "Pago no completado — cancelado automáticamente.",
  });
}
