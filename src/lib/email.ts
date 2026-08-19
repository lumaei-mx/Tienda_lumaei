import { getOrder } from "./orders-db";
import { readStoreSettings } from "./settings-db";
import { formatMoney } from "./money";
import { WELCOME_PROMO_CODE } from "./seed";
import type { Order } from "./types";
import nodemailer from "nodemailer";

/**
 * Email transaccional v2 (Gmail SMTP — sin API de terceros).
 * - Pluggable: sin GMAIL_APP_PASSWORD → no-op, no rompe el flujo (dev local).
 * - Config en .env: GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_FROM.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function emailFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    `Lumaei <${process.env.GMAIL_USER || "no-reply@lumaei.com"}>`
  );
}

function smtpTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });
}

function langFor(order: Order): "es" | "en" {
  return order.market === "MX" ? "es" : "en";
}

function lines(order: Order) {
  return order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#3a2a1a;">${escapeHtml(
            i.name
          )} × ${i.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#3a2a1a;">${formatMoney(
            i.unitPrice * i.qty
          )}</td>
        </tr>`
    )
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildOrderConfirmationHtml(order: Order): string {
  const lang = langFor(order);
  const isEs = lang === "es";
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const statusText = isEs
    ? "Tu pedido está confirmado y en preparación."
    : "Your order is confirmed and being prepared.";
  const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/pedido/${order.id}?key=${order.accessToken || ""}`;
  const settings = { brandName: "Lumaei" };

  return `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f7f2ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border-radius:16px;border:1px solid #e8dcc6;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:#2c1f14;">
            <span style="color:#d9b45b;font-size:22px;font-weight:700;letter-spacing:1px;">${escapeHtml(
              settings.brandName
            )}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:22px;color:#2c1f14;">${
              isEs ? "¡Pedido confirmado!" : "Order confirmed!"
            }</h1>
            <p style="margin:0 0 20px;color:#6b5b48;font-size:15px;">${statusText}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;">${
                  isEs ? "Pedido" : "Order"
                }</td>
                <td style="text-align:right;font-weight:600;color:#2c1f14;">${ref}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;">${
                  isEs ? "Total" : "Total"
                }</td>
                <td style="text-align:right;font-weight:700;color:#2c1f14;padding-top:8px;">${formatMoney(
                  order.total
                )}</td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${lines(order)}
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td style="font-size:13px;color:#6b5b48;">${
                  isEs ? "Envío" : "Shipping"
                }</td>
                <td style="text-align:right;font-size:13px;color:#3a2a1a;">${formatMoney(
                  order.shipping
                )}</td>
              </tr>
              ${
                order.tax > 0
                  ? `<tr>
                    <td style="font-size:13px;color:#6b5b48;">${
                      isEs ? "Impuestos" : "Taxes"
                    }</td>
                    <td style="text-align:right;font-size:13px;color:#3a2a1a;">${formatMoney(
                      order.tax
                    )}</td>
                  </tr>`
                  : ""
              }
              <tr>
                <td style="font-size:14px;font-weight:700;color:#2c1f14;padding-top:8px;border-top:2px solid #e8dcc6;">${
                  isEs ? "Total" : "Total"
                }</td>
                <td style="text-align:right;font-weight:700;color:#2c1f14;padding-top:8px;border-top:2px solid #e8dcc6;">${formatMoney(
                  order.total
                )}</td>
              </tr>
            </table>

            <a href="${trackUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#2c1f14;color:#f4e9d8;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
              ${isEs ? "Ver mi pedido" : "View my order"}
            </a>

            <p style="margin-top:28px;font-size:13px;color:#8a7761;line-height:1.6;">
              ${
                isEs
                  ? "Gracias por tu compra. Si tienes dudas, responde este correo o escríbenos a soporte."
                  : "Thanks for your purchase. If you have questions, reply to this email or contact support."
              }
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildOrderConfirmationText(order: Order): string {
  const isEs = order.market === "MX";
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const items = order.items
    .map((i) => `- ${i.name} × ${i.qty}: ${formatMoney(i.unitPrice * i.qty)}`)
    .join("\n");
  return [
    isEs ? "¡Pedido confirmado!" : "Order confirmed!",
    "",
    isEs ? `Pedido: ${ref}` : `Order: ${ref}`,
    isEs ? `Total: ${formatMoney(order.total)}` : `Total: ${formatMoney(order.total)}`,
    "",
    items,
    "",
    isEs
      ? `Sigue tu pedido aquí: ${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/pedido/${order.id}?key=${order.accessToken || ""}`
      : `Track your order here: ${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/pedido/${order.id}?key=${order.accessToken || ""}`,
  ].join("\n");
}

/**
 * Envía la confirmación de pedido al cliente.
 * Sin GMAIL_APP_PASSWORD: no-op (dev local) — devuelve { skipped: true }.
 * Si falla, NO lanza: devuelve { ok: false, error } para que el caller decida
 * (el flujo de checkout nunca debe romperse por un email).
 */
export async function sendOrderConfirmation(
  order: Order
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, skipped: true };
  }
  const subject = `Lumaei — ${
    order.market === "MX" ? "Confirmación de pedido" : "Order confirmation"
  } ${`#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`}`;

  try {
    const transporter = smtpTransport();
    const info = await transporter.sendMail({
      from: emailFrom(),
      to: [order.customer.email],
      subject,
      html: buildOrderConfirmationHtml(order),
      text: buildOrderConfirmationText(order),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "error enviando email",
    };
  }
}

/** Email al cliente: pago recibido, pedido en espera de autorización de envío.
 *  El GM NO libera efectivo (cumplir = gastar balance CJ) sin autorización del
 *  dueño, así que tras el pago el cliente recibe este aviso, no la confirmación
 *  de "en preparación". La confirmación real se envía al aprobar el dueño. */
export function buildOrderAwaitingApprovalHtml(order: Order): string {
  const lang = langFor(order);
  const isEs = lang === "es";
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/pedido/${order.id}?key=${order.accessToken || ""}`;
  const settings = { brandName: "Lumaei" };

  return `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f7f2ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border-radius:16px;border:1px solid #e8dcc6;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:#2c1f14;">
            <span style="color:#d9b45b;font-size:22px;font-weight:700;letter-spacing:1px;">${escapeHtml(
              settings.brandName
            )}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:22px;color:#2c1f14;">${
              isEs ? "¡Pago recibido!" : "Payment received!"
            }</h1>
            <p style="margin:0 0 20px;color:#6b5b48;font-size:15px;">${
              isEs
                ? "Hemos recibido tu pago. Tu pedido está en revisión de autorización para el envío."
                : "We have received your payment. Your order is awaiting shipping authorization."
            }</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;">${
                  isEs ? "Pedido" : "Order"
                }</td>
                <td style="text-align:right;font-weight:600;color:#2c1f14;">${ref}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;">${
                  isEs ? "Total" : "Total"
                }</td>
                <td style="text-align:right;font-weight:700;color:#2c1f14;padding-top:8px;">${formatMoney(
                  order.total
                )}</td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${lines(order)}
            </table>

            <a href="${trackUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#2c1f14;color:#f4e9d8;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
              ${isEs ? "Ver mi pedido" : "View my order"}
            </a>

            <p style="margin-top:28px;font-size:13px;color:#8a7761;line-height:1.6;">
              ${
                isEs
                  ? "Te avisaremos por correo en cuanto tu pedido pase a preparación y envío. Si tienes dudas, responde este correo."
                  : "We will email you as soon as your order moves to preparation and shipping. If you have questions, reply to this email."
              }
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildOrderAwaitingApprovalText(order: Order): string {
  const isEs = order.market === "MX";
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const items = order.items
    .map((i) => `- ${i.name} × ${i.qty}: ${formatMoney(i.unitPrice * i.qty)}`)
    .join("\n");
  return [
    isEs ? "¡Pago recibido!" : "Payment received!",
    "",
    isEs
      ? "Hemos recibido tu pago. Tu pedido está en revisión de autorización para el envío."
      : "We have received your payment. Your order is awaiting shipping authorization.",
    "",
    isEs ? `Pedido: ${ref}` : `Order: ${ref}`,
    isEs ? `Total: ${formatMoney(order.total)}` : `Total: ${formatMoney(order.total)}`,
    "",
    items,
    "",
    isEs
      ? `Sigue tu pedido aquí: ${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/pedido/${order.id}?key=${order.accessToken || ""}`
      : `Track your order here: ${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/pedido/${order.id}?key=${order.accessToken || ""}`,
  ].join("\n");
}

export async function sendOrderAwaitingApproval(
  order: Order
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, skipped: true };
  }
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const subject = `Lumaei — ${
    order.market === "MX" ? "Pago recibido · autorización de envío" : "Payment received · shipping authorization"
  } ${ref}`;
  try {
    const transporter = smtpTransport();
    await transporter.sendMail({
      from: emailFrom(),
      to: [order.customer.email],
      subject,
      html: buildOrderAwaitingApprovalHtml(order),
      text: buildOrderAwaitingApprovalText(order),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "error enviando email",
    };
  }
}

/** Email al dueño: pedido listo para cumplir, requiere su autorización de
 *  gasto (liberar balance CJ). Incluye unit economics para decidir. */
export function ownerEmail(): string {
  return process.env.OWNER_EMAIL || "lumaeiMX@gmail.com";
}

export function buildOwnerApprovalRequestHtml(order: Order): string {
  const lang = langFor(order);
  const isEs = lang === "es";
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/admin/pedido/${order.id}`;
  const items = order.items
    .map(
      (i) =>
        `<li style="margin:4px 0;color:#3a2a1a;">${escapeHtml(i.name)} × ${i.qty}</li>`
    )
    .join("");
  return `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f7f2ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border-radius:16px;border:1px solid #e8dcc6;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:#2c1f14;">
            <span style="color:#d9b45b;font-size:22px;font-weight:700;letter-spacing:1px;">Lumaei · GM</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:20px;color:#2c1f14;">${
              isEs ? "Pedido requiere tu autorización" : "Order needs your approval"
            }</h1>
            <p style="margin:0 0 16px;color:#6b5b48;font-size:14px;">${
              isEs
                ? "Se recibió el pago. Para cumplir el pedido se liberará saldo del proveedor (gasto). Requiere tu autorización."
                : "Payment received. Fulfilling this order will release supplier balance (a spend). It needs your approval."
            }</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;">${
                  isEs ? "Pedido" : "Order"
                }</td>
                <td style="text-align:right;font-weight:600;color:#2c1f14;">${ref}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;">${
                  isEs ? "Cliente" : "Customer"
                }</td>
                <td style="text-align:right;font-weight:600;color:#2c1f14;padding-top:8px;">${escapeHtml(
                  order.customer.name
                )}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;">${
                  isEs ? "Mercado" : "Market"
                }</td>
                <td style="text-align:right;font-weight:600;color:#2c1f14;padding-top:8px;">${order.market}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#8a7761;text-transform:uppercase;letter-spacing:0.5px;padding-top:8px;">${
                  isEs ? "Ganancia neta est." : "Est. net profit"
                }</td>
                <td style="text-align:right;font-weight:700;color:#2c1f14;padding-top:8px;">$${order.estimatedProfitUsd.toFixed(
                  2
                )} USD</td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#6b5b48;">${isEs ? "Productos:" : "Items:"}</p>
            <ul style="margin:0 0 20px;padding-left:18px;font-size:13px;">${items}</ul>

            <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#2c1f14;color:#f4e9d8;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
              ${isEs ? "Autorizar y cumplir" : "Authorize & fulfill"}
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildOwnerApprovalRequestText(order: Order): string {
  const isEs = order.market === "MX";
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const items = order.items.map((i) => `- ${i.name} × ${i.qty}`).join("\n");
  return [
    isEs ? "Pedido requiere tu autorización" : "Order needs your approval",
    "",
    isEs
      ? `Pedido ${ref} · ${order.customer.name} (${order.market})`
      : `Order ${ref} · ${order.customer.name} (${order.market})`,
    `Est. net profit: $${order.estimatedProfitUsd.toFixed(2)} USD`,
    "",
    items,
    "",
    `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com"}/admin/pedido/${order.id}`,
  ].join("\n");
}

export async function sendOwnerApprovalRequest(
  order: Order
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, skipped: true };
  }
  const ref = `#${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`;
  const subject = `Lumaei — ${
    order.market === "MX" ? "Autoriza envío del pedido" : "Authorize order shipment"
  } ${ref}`;
  try {
    const transporter = smtpTransport();
    await transporter.sendMail({
      from: emailFrom(),
      to: [ownerEmail()],
      subject,
      html: buildOwnerApprovalRequestHtml(order),
      text: buildOwnerApprovalRequestText(order),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "error enviando email",
    };
  }
}

/** Reenvío manual desde admin: orden completa por id. */
export async function resendOrderConfirmationById(
  orderId: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string; found?: boolean }> {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, found: false };
  const result = await sendOrderConfirmation(order);
  return { ...result, found: true };
}

// ==== Lead magnet: "5 gadgets que te ahorran 1h al día" (email capture) ====

const LEAD_MAGNET_SLUG = "/guia/5-gadgets";

function leadMagnetUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lumaei.com";
  return `${base}${LEAD_MAGNET_SLUG}`;
}

export function buildLeadMagnetHtml(): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f7f2ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border-radius:16px;border:1px solid #e8dcc6;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:#2c1f14;">
            <span style="color:#d9b45b;font-size:22px;font-weight:700;letter-spacing:1px;">Lumaei</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;color:#2c1f14;">Tu lista: 5 gadgets que te ahorran 1h al día</h1>
            <p style="margin:0 0 16px;color:#6b5b48;font-size:15px;line-height:1.6;">
              Hola 👋 — hace un momento pediste la lista en la tienda. Aquí está:
              5 gadgets que de verdad uso en casa y que juntos me ahorran más de una hora al día.
              Nada de relleno: solo lo que funciona.
            </p>
            <p style="margin:0 0 16px;color:#6b5b48;font-size:15px;line-height:1.6;">
              Cada gadget tiene un enlace directo a la tienda por si quieres verlo en detalle.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2ea;border-radius:12px;padding:16px;margin:0 0 24px;">
              <tr>
                <td style="font-size:13px;color:#8a7761;">Regalo de bienvenida por estar aquí:</td>
              </tr>
              <tr>
                <td style="font-size:22px;font-weight:700;color:#2c1f14;padding-top:4px;">10% de descuento en tu 1ª compra</td>
              </tr>
              <tr>
                <td style="padding-top:8px;">
                  <span style="display:inline-block;background:#2c1f14;color:#f4e9d8;font-family:monospace;font-weight:700;letter-spacing:1px;font-size:15px;padding:6px 12px;border-radius:8px;">${WELCOME_PROMO_CODE}</span>
                  <span style="font-size:13px;color:#6b5b48;margin-left:8px;">aplícalo al pagar.</span>
                </td>
              </tr>
            </table>
            <a href="${leadMagnetUrl()}" style="display:inline-block;padding:12px 24px;background:#2c1f14;color:#f4e9d8;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
              Ver mi lista
            </a>
            <p style="margin-top:28px;font-size:13px;color:#8a7761;line-height:1.6;">
              Si este correo no te dice nada o ya no quieres recibir mensajes de Lumaei, respóndenos y te sacamos de la lista.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildLeadMagnetText(): string {
  return [
    "Hola 👋 — aquí está la lista que pediste en Lumaei:",
    "",
    "5 gadgets que te ahorran 1h al día (en serio). Nada de relleno: solo lo que funciona.",
    "",
    `Ver la lista: ${leadMagnetUrl()}`,
    "",
    `Regalo de bienvenida: 10% de descuento en tu 1ª compra con el código ${WELCOME_PROMO_CODE} al pagar.`,
    "",
    "Si este correo no te dice nada, respóndenos y te sacamos de la lista.",
  ].join("\n");
}

/**
 * Envía el lead magnet al email capturado.
 * Misma política que los emails transaccionales:
 * sin GMAIL_APP_PASSWORD → no-op (dev local) y NUNCA lanza.
 */
export async function sendLeadMagnetEmail(
  email: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, skipped: true };
  }
  try {
    const transporter = smtpTransport();
    await transporter.sendMail({
      from: emailFrom(),
      to: [email],
      subject: "Tu lista: 5 gadgets que te ahorran 1h al día",
      html: buildLeadMagnetHtml(),
      text: buildLeadMagnetText(),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "error enviando email",
    };
  }
}
