import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runCjSync } from "@/lib/automation/sync-cj";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  const result = await runCjSync();
  return NextResponse.json(result);
}
