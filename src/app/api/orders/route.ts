import { NextResponse } from "next/server";
import { readOrders } from "@/lib/orders-db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const orders = await readOrders();
  return NextResponse.json({ orders });
}
