import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { listAlerts } from "@/lib/automation/alert";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ alerts: await listAlerts() });
}
