import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { listOpportunities } from "@/lib/opportunity-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const opportunities = await listOpportunities(
    status as "new" | "approved" | "rejected" | "imported" | undefined
  );
  const sorted = [...opportunities].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );
  return NextResponse.json({ opportunities: sorted });
}
