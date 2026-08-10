import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readProducts } from "@/lib/products-db";
import {
  currentSeason,
  nextSeason,
  SEASONS,
  listCatalogs,
} from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const [products, catalogs] = await Promise.all([
    readProducts(),
    listCatalogs(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const seasons = SEASONS.map((s) => {
    const catalog = catalogs.find((c) => c.season === s.key);
    const items = (catalog?.productIds || [])
      .map((pid) => byId.get(pid))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        name: p!.name,
        priceUsd: p!.priceUsd,
        active: p!.active,
      }));
    return {
      key: s.key,
      name: s.name,
      emoji: s.emoji,
      start: s.start,
      end: s.end,
      count: items.length,
      items,
    };
  });

  return NextResponse.json({
    current: currentSeason(),
    next: nextSeason(),
    seasons,
  });
}
