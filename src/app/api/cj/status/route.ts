import { NextResponse } from "next/server";
import { testCjConnection, isCjConfigured } from "@/lib/cj";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const status = await testCjConnection();
  return NextResponse.json({ configured: isCjConfigured(), ...status });
}
