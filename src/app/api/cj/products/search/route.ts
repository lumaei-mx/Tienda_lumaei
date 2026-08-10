import { NextResponse } from "next/server";
import { searchCjProducts } from "@/lib/cj";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    if (q.length < 2) {
      return NextResponse.json(
        { error: "Usa al menos 2 caracteres" },
        { status: 400 }
      );
    }
    const page = Number(searchParams.get("page") || 1);
    const countryCode = searchParams.get("country") || undefined;
    const result = await searchCjProducts({
      keyword: q,
      page,
      size: 20,
      countryCode,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error CJ search" },
      { status: 500 }
    );
  }
}
