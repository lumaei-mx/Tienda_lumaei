import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { resolveAlert } from "@/lib/automation/alert";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await resolveAlert(id);
  return NextResponse.json({ ok: true });
}
