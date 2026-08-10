import { NextResponse } from "next/server";
import { isCjConfigured, testCjConnection } from "@/lib/cj";
import { isStripeConfigured } from "@/lib/stripe";
import { isRedisAvailable } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const cj = isCjConfigured()
    ? await testCjConnection().catch((e) => ({
        ok: false,
        mode: "error",
        error: e instanceof Error ? e.message : "error",
      }))
    : { ok: false, mode: "unconfigured" };

  // Flags de runtime que determinan si las órdenes se PAGAN y se CUMPLEN.
  // Expuestas en health para verificación (no son secretos).
  const cjSandbox = process.env.CJ_SANDBOX === "true";
  const cjAutoPay = process.env.CJ_AUTO_PAY_BALANCE === "true";

  return NextResponse.json({
    ok:
      isRedisAvailable() &&
      (cj as { ok?: boolean }).ok !== false &&
      !cjSandbox &&
      cjAutoPay,
    services: {
      redis: isRedisAvailable(),
      stripe: isStripeConfigured(),
      cj: {
        ...(cj as object),
        sandbox: cjSandbox,
        autoPay: cjAutoPay,
        // ok de negocio: CJ configurado, NO sandbox, y auto-pay activo
        fulfillmentReady: (cj as { ok?: boolean }).ok === true && !cjSandbox && cjAutoPay,
      },
    },
    time: new Date().toISOString(),
  });
}
