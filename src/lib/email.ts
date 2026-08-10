import { getOrder } from "./orders-db";
import { readStoreSettings } from "./settings-db";
import { formatMoney } from "./money";
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
    `Lumaei <${process.env.GMAIL_USER || "no-reply@lumaei.shop"}>`
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
  const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://lumaei.shop"}/pedido/${order.id}?key=${order.accessToken || ""}`;
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
      ? `Sigue tu pedido aquí: ${process.env.NEXT_PUBLIC_SITE_URL || "https://lumaei.shop"}/pedido/${order.id}?key=${order.accessToken || ""}`
      : `Track your order here: ${process.env.NEXT_PUBLIC_SITE_URL || "https://lumaei.shop"}/pedido/${order.id}?key=${order.accessToken || ""}`,
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

/** Reenvío manual desde admin: orden completa por id. */
export async function resendOrderConfirmationById(
  orderId: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string; found?: boolean }> {
  const order = await getOrder(orderId);
  if (!order) return { ok: false, found: false };
  const result = await sendOrderConfirmation(order);
  return { ...result, found: true };
}
