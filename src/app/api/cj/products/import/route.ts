import { NextResponse } from "next/server";
import { importCjProduct } from "@/lib/cj";
import { upsertProduct } from "@/lib/products-db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const pid = String(body.pid || "");
    if (!pid) {
      return NextResponse.json({ error: "pid requerido" }, { status: 400 });
    }
    const product = await importCjProduct(pid);
    if (body.featured) product.featured = true;
    const saved = await upsertProduct(product);
    return NextResponse.json({ product: saved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error import" },
      { status: 500 }
    );
  }
}
