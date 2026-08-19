import { NextResponse } from "next/server";
import {
  LEAD_SOURCES,
  consumeLeadRate,
  isValidEmail,
  leadId,
  saveLead,
} from "@/lib/leads";
import { sendLeadMagnetEmail } from "@/lib/email";
import { ensureWelcomePromo } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * POST /api/leads — captura de email (popup exit-intent).
 * - 400: email inválido o body no JSON
 * - 429: rate limit (máx. 3 por email por día)
 * - 200: { ok, email, source, savedTo, emailSent, emailSkipped }
 * El envío del lead magnet NUNCA rompe el flujo: si el email no está
 * configurado o falla, el lead se guarda igual y se reporta en la respuesta.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown } | null = null;
  try {
    body = (await req.json()) as { email?: unknown; source?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const emailRaw = typeof body?.email === "string" ? body.email : "";
  if (!isValidEmail(emailRaw)) {
    return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
  }
  const email = leadId(emailRaw);

  const source =
    typeof body?.source === "string" && LEAD_SOURCES.has(body.source)
      ? body.source
      : "exit_intent";

  if (await consumeLeadRate(email)) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes para este email. Intenta mañana." },
      { status: 429 }
    );
  }

  const saved = await saveLead(email, source);

  // Asegura que el código de bienvenida exista para cuando el suscriptor
  // lo aplique en el checkout (idempotente, no bloquea el flujo).
  await ensureWelcomePromo().catch(() => {});

  // El envío del lead magnet es best-effort: nunca bloquea la respuesta.
  const mailResult = await sendLeadMagnetEmail(email);

  return NextResponse.json({
    ok: true,
    email,
    source,
    savedTo: saved.backend,
    emailSent: mailResult.ok,
    emailSkipped: mailResult.skipped ?? false,
  });
}
