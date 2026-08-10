import type { Address, Customer, Order, OrderItem } from "@/lib/types";
import { cjRequest, isCjConfigured } from "./client";
import type { CjFreightOption } from "./types";

const COUNTRY_NAME: Record<string, string> = {
  MX: "Mexico",
  US: "United States",
};

export async function calculateFreight(input: {
  startCountryCode?: string;
  endCountryCode: string;
  products: Array<{ vid: string; quantity: number }>;
  zip?: string;
}): Promise<CjFreightOption[]> {
  const data = await cjRequest<CjFreightOption[] | { list?: CjFreightOption[] }>(
    "/logistic/freightCalculate",
    {
      method: "POST",
      body: {
        startCountryCode: input.startCountryCode || "CN",
        endCountryCode: input.endCountryCode,
        products: input.products,
        zip: input.zip,
      },
    }
  );

  if (Array.isArray(data)) return data;
  return data?.list || [];
}

export function pickCheapest(options: CjFreightOption[]): CjFreightOption | null {
  if (!options.length) return null;
  return [...options].sort((a, b) => {
    const pa = a.logisticPrice ?? a.totalPostage ?? a.postage ?? 999;
    const pb = b.logisticPrice ?? b.totalPostage ?? b.postage ?? 999;
    return pa - pb;
  })[0];
}

export interface CreateCjOrderResult {
  cjOrderId: string;
  mode: "live" | "simulated" | "sandbox";
  logisticName?: string;
  freightUsd?: number;
  raw?: unknown;
}

/**
 * Crea orden en CJ (createOrderV2).
 * payType: 3 = solo crear (luego pagar balance manual/auto)
 * isSandbox: 1 si CJ_SANDBOX=true
 */
export async function createCjOrder(input: {
  orderNumber: string;
  shippingAddress: Address;
  customer: Customer;
  items: OrderItem[];
  payWithBalance?: boolean;
}): Promise<CreateCjOrderResult> {
  if (!isCjConfigured()) {
    return {
      cjOrderId: `SIM-CJ-${input.orderNumber.slice(0, 8).toUpperCase()}`,
      mode: "simulated",
    };
  }

  const country = input.shippingAddress.country;
  const products = input.items.map((i) => ({
    vid: i.cjVariantId || i.cjSku,
    quantity: i.qty,
    unitPrice: i.costUsd,
  }));

  let logisticName = process.env.CJ_DEFAULT_LOGISTIC || "CJPacket Ordinary";
  let freightUsd: number | undefined;

  try {
    const freight = await calculateFreight({
      endCountryCode: country,
      products: products.map((p) => ({ vid: p.vid, quantity: p.quantity })),
      zip: input.shippingAddress.zip,
    });
    const best = pickCheapest(freight);
    if (best?.logisticName) {
      logisticName = best.logisticName;
      freightUsd =
        best.logisticPrice ?? best.totalPostage ?? best.postage;
    }
  } catch {
    // usa default logistic
  }

  const isSandbox = process.env.CJ_SANDBOX === "true" ? 1 : 0;
  const payType = input.payWithBalance
    ? 2
    : process.env.CJ_AUTO_PAY_BALANCE === "true"
      ? 2
      : 3;

  const body = {
    orderNumber: input.orderNumber,
    shippingCustomerName: input.customer.name,
    shippingPhone: input.customer.phone || "0000000000",
    shippingCountry: COUNTRY_NAME[country] || country,
    shippingCountryCode: country,
    shippingProvince: input.shippingAddress.state,
    shippingCity: input.shippingAddress.city,
    shippingAddress: input.shippingAddress.line1,
    shippingAddress2: input.shippingAddress.line2 || "",
    shippingZip: input.shippingAddress.zip,
    email: input.customer.email,
    logisticName,
    fromCountryCode: process.env.CJ_FROM_COUNTRY || "CN",
    payType,
    isSandbox,
    platform: "api",
    shopLogisticsType: 2,
    orderFlow: 1,
    remark: `Lumaei order ${input.orderNumber}`,
    products,
  };

  const data = await cjRequest<Record<string, unknown>>(
    "/shopping/order/createOrderV2",
    { method: "POST", body }
  );

  const cjOrderId = String(
    data?.orderId ||
      data?.orderNum ||
      data?.id ||
      (data as { data?: { orderId?: string } })?.data?.orderId ||
      `CJ-${input.orderNumber}`
  );

  // Pagar con balance CJ si está habilitado y no es sandbox create-only.
  // OJO: payBalanceV2 exige el shipmentOrderId REAL (CJ2608...), no el
  // orderCode SD2608... que devuelve createOrderV2. Reusar payCjOrder
  // (que resuelve el detalle) en vez de mandar orderId directo.
  if (
    payType === 2 &&
    isSandbox === 0 &&
    process.env.CJ_AUTO_PAY_BALANCE === "true"
  ) {
    try {
      const resolved = await getCjOrderDetail(cjOrderId);
      const shipmentOrderId = resolved?.cjOrderId || cjOrderId;
      await cjRequest("/shopping/pay/payBalanceV2", {
        method: "POST",
        body: { shipmentOrderId },
      });
    } catch {
      // queda creada sin pagar — admin puede reintentar
    }
  }

  return {
    cjOrderId,
    mode: isSandbox ? "sandbox" : "live",
    logisticName,
    freightUsd,
    raw: data,
  };
}

/**
 * Consulta el estado real de una orden CJ (por cjOrderId/cjOrderCode).
 * Devuelve null si no existe o la API falla de forma recuperable.
 */
export async function getCjOrderDetail(
  cjOrderId: string
): Promise<
  | {
      orderId: string;
      cjOrderId: string;
      cjOrderCode: string;
      orderStatus: string;
      orderAmount: number;
      productAmount: number;
      postageAmount: number;
      isSandbox: number;
      trackingNumber?: string | null;
      trackingUrl?: string | null;
    }
  | null
  | undefined
> {
  if (!isCjConfigured() || cjOrderId.startsWith("SIM-")) return null;
  const data = await cjRequest<Record<string, unknown>>(
    "/shopping/order/getOrderDetail",
    { method: "GET", params: { orderId: cjOrderId } }
  );
  if (!data) return null;
  return {
    orderId: String(data.orderId || ""),
    cjOrderId: String(data.cjOrderId || ""),
    cjOrderCode: String(data.cjOrderCode || data.orderNum || ""),
    orderStatus: String(data.orderStatus || ""),
    orderAmount: Number(data.orderAmount ?? 0),
    productAmount: Number(data.productAmount ?? 0),
    postageAmount: Number(data.postageAmount ?? 0),
    isSandbox: Number(data.isSandbox ?? 0),
    trackingNumber: (data.trackingNumber as string | null) ?? null,
    trackingUrl: (data.trackingUrl as string | null) ?? null,
  };
}

/**
 * Paga una orden CJ existente con balance de la cuenta.
 * Requiere el `shipmentOrderId` REAL de CJ (formato CJ2608...), no el
 * orderCode SD2608...: primero resuelve el detalle y usa su cjOrderId.
 * Devuelve true si el pago se ejecutó (o ya estaba pagada).
 */
export async function payCjOrder(cjOrderId: string): Promise<boolean> {
  // El ID que la app guarda suele ser el orderCode (SD...). El endpoint de
  // pago exige el shipmentOrderId real (CJ2608...): lo resolvemos del detalle.
  const detail = await getCjOrderDetail(cjOrderId);
  // El endpoint de pago exige el shipmentOrderId REAL (formato CJ2608...),
  // no el orderCode SD2608... ni el orderId numérico interno.
  const shipmentOrderId = detail?.cjOrderId || cjOrderId;
  await cjRequest("/shopping/pay/payBalanceV2", {
    method: "POST",
    body: { shipmentOrderId },
  });
  return true;
}

export async function fulfillOrderViaCj(order: Order): Promise<Order> {
  // Idempotencia REAL: si ya hay orden CJ creada (reintento tras muerte del
  // proceso, o retry sobre una orden existente), verificar su estado en CJ
  // ANTES de marcar sent_to_cj: una orden UNPAID no está cumplida — intenta
  // pagarla con balance; si el balance no alcanza, permanece en cola.
  if (order.cjOrderId && !order.cjOrderId.startsWith("SIM-")) {
    try {
      const detail = await getCjOrderDetail(order.cjOrderId);
      if (detail) {
        const status = String(detail.orderStatus || "").toUpperCase();
        const paid =
          status === "PAID" ||
          status === "CREATED" ||
          status === "SHIPPED" ||
          status === "DELIVERED" ||
          status === "COMPLETED" ||
          status.includes("SHIP");
        if (paid) {
          return {
            ...order,
            status: "sent_to_cj",
            autoFulfilled: true,
            cjOrderStatus: detail.orderStatus,
            cjOrderRealId: detail.cjOrderId || order.cjOrderRealId,
            trackingNumber: detail.trackingNumber || order.trackingNumber,
            updatedAt: new Date().toISOString(),
          };
        }
        // UNPAID: intentar pagar con balance.
        if (status === "UNPAID" || status === "CREATED-UNPAID") {
          try {
            await payCjOrder(order.cjOrderId);
            return {
              ...order,
              status: "sent_to_cj",
              autoFulfilled: true,
              cjOrderStatus: "PAID",
              cjOrderRealId: detail.cjOrderId || order.cjOrderRealId,
              cjAmountUsd: detail.orderAmount,
              shippingCostUsd: detail.postageAmount || order.shippingCostUsd,
              updatedAt: new Date().toISOString(),
            };
          } catch (err) {
            const msg = err instanceof Error ? err.message : "balance insuficiente";
            return {
              ...order,
              status: "fulfillment_queued",
              autoFulfilled: false,
              cjOrderStatus: "UNPAID",
              cjAmountUsd: detail.orderAmount,
              notes: `Orden CJ ${order.cjOrderId} existe pero está UNPAID (monto ${detail.orderAmount} USD). Intento de pago con balance falló: ${msg}. Fondear la cuenta CJ para cumplir.`,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // API CJ no respondió; no inventar estado — mantener en cola.
      return {
        ...order,
        status: "fulfillment_queued",
        autoFulfilled: false,
        notes: `No se pudo verificar estado de la orden CJ ${order.cjOrderId}. Reintentando...`,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const result = await createCjOrder({
    orderNumber: order.id,
    shippingAddress: order.shippingAddress,
    customer: order.customer,
    items: order.items,
  });

  const note =
    result.mode === "simulated"
      ? "Fulfillment simulado. Configura CJ_API_KEY en .env.local."
      : result.mode === "sandbox"
        ? `Orden sandbox CJ ${result.cjOrderId} · ${result.logisticName || ""}`
        : `Orden CJ ${result.cjOrderId} · ${result.logisticName || "logística"} · auto`;

  return {
    ...order,
    status: "sent_to_cj",
    cjOrderId: result.cjOrderId,
    autoFulfilled: true,
    shippingCostUsd: result.freightUsd ?? order.shippingCostUsd,
    notes: note,
    updatedAt: new Date().toISOString(),
  };
}

export async function getCjTracking(cjOrderId: string) {
  if (!isCjConfigured() || cjOrderId.startsWith("SIM-")) {
    return {
      trackingNumber: undefined as string | undefined,
      carrier: undefined as string | undefined,
      status: undefined as string | undefined,
    };
  }
  const data = await cjRequest<Record<string, unknown>>(
    "/logistic/trackInfo",
    {
      method: "GET",
      params: { orderId: cjOrderId },
    }
  );
  return {
    trackingNumber: (data?.trackingNumber || data?.trackNumber) as
      | string
      | undefined,
    carrier: (data?.logisticName || data?.carrier) as string | undefined,
    status: data?.status as string | undefined,
  };
}
