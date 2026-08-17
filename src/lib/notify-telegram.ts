/**
 * Canal de notificación push al dueño vía Telegram.
 * Se usa para alertas críticas del negocio (pedidos que requieren autorización,
 * saldo insuficiente, fallos de fulfill) y para reportes periódicos del GM.
 *
 * Configuración (en .env):
 *   TELEGRAM_BOT_TOKEN = token de @BotFather
 *   TELEGRAM_CHAT_ID   = id del chat del dueño (puede ser su usuario o un grupo)
 *
 * Sin ambas vars → no-op (no rompe el flujo, igual que el email).
 */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramMessage(
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isTelegramConfigured()) return { ok: false, error: "not configured" };
  const token = process.env.TELEGRAM_BOT_TOKEN as string;
  const chatId = process.env.TELEGRAM_CHAT_ID as string;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  // Telegram limita los mensajes a 4096 chars; truncamos con aviso.
  const safe = text.length > 4000 ? text.slice(0, 3990) + "\n…(truncado)" : text;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: safe,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "error de red",
    };
  }
}
