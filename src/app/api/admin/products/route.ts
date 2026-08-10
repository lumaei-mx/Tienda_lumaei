import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readProducts } from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const products = await readProducts();
  const sorted = [...products].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return NextResponse.json({ products: sorted });
}
