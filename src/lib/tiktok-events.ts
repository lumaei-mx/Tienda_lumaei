import { createHash } from "crypto";
import type { Order } from "./types";

const API_URL = "https://business-api.tiktok.com/open_api/v1.3/pixel/track/";

export function isTikTokEventsConfigured() {
  return Boolean(
    process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_PIXEL_ID
  );
}

export function tiktokHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

interface TikTokEventInput {
  event: string;
  eventId: string;
  timestamp?: number;
  properties?: Record<string, unknown>;
  context?: {
    ip?: string;
    userAgent?: string;
    url?: string;
    user?: { email?: string; phone?: string };
  };
}

/**
 * Envía un evento a la Events API de TikTok (server-side).
 * Respeta el modo test (TIKTOK_TEST_EVENT_CODE). Nunca lanza al caller.
 */
export async function sendTikTokEvent(input: TikTokEventInput) {
  if (!isTikTokEventsConfigured()) return;

  const token = process.env.TIKTOK_ACCESS_TOKEN!;
  const pixel = process.env.TIKTOK_PIXEL_ID!;

  const body: Record<string, unknown> = {
    pixel_code: pixel,
    event: input.event,
    event_id: input.eventId,
    timestamp: String(input.timestamp ?? Math.floor(Date.now() / 1000)),
    context: {
      page: input.context?.url ? { url: input.context.url } : undefined,
      user: {},
      ...(input.context?.ip ? { ip: input.context.ip } : {}),
      ...(input.context?.userAgent
        ? { user_agent: input.context.userAgent }
        : {}),
    },
    properties: input.properties ?? {},
  };

  const ctxUser: Record<string, string> = {};
  if (input.context?.user?.email) {
    ctxUser.email = tiktokHash(input.context.user.email.toLowerCase().trim());
  }
  if (input.context?.user?.phone) {
    ctxUser.phone = tiktokHash(input.context.user.phone.replace(/\D/g, ""));
  }
  body.context = {
    ...(body.context as Record<string, unknown>),
    user: ctxUser,
  };

  if (process.env.TIKTOK_TEST_MODE === "true" && process.env.TIKTOK_TEST_EVENT_CODE) {
    body.test_event_code = process.env.TIKTOK_TEST_EVENT_CODE;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (data && data.code !== 0) {
      console.error(
        `[tiktok-events] ${input.event} falló: ${data.message} (code=${data.code})`
      );
    }
  } catch (err) {
    console.error(
      `[tiktok-events] ${input.event} error:`,
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * CompletePayment + PlaceAnOrder — se dispara server-side tras pago
 * verificado (Stripe webhook / demo). Única fuente de verdad de conversión.
 */
export async function trackOrderPaid(order: Order) {
  if (!isTikTokEventsConfigured()) return;

  const contents = order.items.map((i) => ({
    content_id: i.productId,
    content_type: "product",
    content_name: i.name,
    num_items: i.qty,
  }));

  const common = {
    timestamp: new Date(order.createdAt).getTime() / 1000,
    properties: {
      contents,
      value: order.total,
      currency: "USD",
    },
    context: {
      user: {
        email: order.customer.email,
        ...(order.customer.phone ? { phone: order.customer.phone } : {}),
      },
    },
  };

  await Promise.allSettled([
    sendTikTokEvent({
      event: "CompletePayment",
      eventId: `${order.id}-complete-payment`,
      ...common,
    }),
    sendTikTokEvent({
      event: "PlaceAnOrder",
      eventId: `${order.id}-place-an-order`,
      ...common,
    }),
  ]);
}
