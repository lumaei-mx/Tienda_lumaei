import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runReprice } from "@/lib/automation/reprice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const unauthorized = authorizeCron(req);
  if (unauthorized) return unauthorized;
  try {
    const result = await runReprice();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
