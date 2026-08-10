import { NextResponse } from "next/server";
import {
  adminCookie,
  checkPassword,
  isAdminConfigured,
  makeAdminToken,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const password = String(body?.password || "");
  if (!(await checkPassword(password))) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", adminCookie(await makeAdminToken()));
  return res;
}
