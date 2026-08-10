import { NextResponse } from "next/server";

/**
 * Verifica que la llamada al cron venga de nuestro scheduler (cron-job.org)
 * vía header `x-cron-secret` o `authorization: Bearer <CRON_SECRET>`.
 */
export function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const header =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (header !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}
