import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearAdminCookie());
  return res;
}

export async function GET(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const res = NextResponse.redirect(
    new URL("/admin/login", `${proto}://${host}`),
    303
  );
  res.headers.set("Set-Cookie", clearAdminCookie());
  return res;
}
