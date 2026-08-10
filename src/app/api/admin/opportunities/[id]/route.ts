import { NextResponse } from "next/server";
import type { Product } from "@/lib/types";
import { isAdminRequest } from "@/lib/admin-auth";
import { importCjProduct } from "@/lib/cj";
import { upsertProduct } from "@/lib/products-db";
import { readStoreSettings } from "@/lib/settings-db";
import {
  getOpportunity,
  setOpportunityStatus,
  updateOpportunity,
} from "@/lib/opportunity-db";
import { fetchCompetitorPrices, computeCompetitivePrice } from "@/lib/automation/competitor-pricing";
import {
  currentSeason,
  nextSeason,
  addProductToSeason,
} from "@/lib/catalog-db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Rechaza una oportunidad para que no reaparezca como nueva */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(_req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const opp = await setOpportunityStatus(id, "rejected");
  if (!opp) {
    return NextResponse.json({ error: "Oportunidad no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ opportunity: opp });
}

/** Aprueba una oportunidad: la importa como producto y la asigna a una temporada */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const season = body?.season || currentSeason()?.key || nextSeason().key;
    const manualPrice = typeof body?.manualPriceUsd === "number" ? body.manualPriceUsd : null;

    const opp = await getOpportunity(id);
    if (!opp) {
      return NextResponse.json({ error: "Oportunidad no encontrada" }, { status: 404 });
    }
    if (opp.status === "imported") {
      return NextResponse.json({ error: "Ya importada" }, { status: 400 });
    }

    const landedMax = Math.max(opp.landedMx, opp.landedUs);

    // si el admin fijó precio manual → validar que cubra costo mínimo
    if (manualPrice !== null) {
      if (manualPrice <= 0) {
        return NextResponse.json({ error: "Precio manual inválido" }, { status: 400 });
      }
      const s = await readStoreSettings();
      const minMargin = s.minMarginPct ?? 20;
      const feeRate = s.paymentFeeRate ?? 0.036;
      const minAcceptable = Number((landedMax * (1 + minMargin / 100) / (1 - feeRate)).toFixed(2));
      if (manualPrice < minAcceptable) {
        return NextResponse.json(
          {
            error: `Precio manual $${manualPrice} es por debajo del costo mínimo ($${minAcceptable}).`,
            reason: "manual_price_below_min",
          },
          { status: 409 }
        );
      }
      const product = await importCjProduct(opp.pid);
      product.priceUsd = Number(manualPrice.toFixed(2));
      product.manualPriceUsd = Number(manualPrice.toFixed(2));
      product.featured = true;
      const saved = await upsertProduct(product);

      await addProductToSeason(season, saved.id);
      await setOpportunityStatus(opp.pid, "imported", { season });
      return NextResponse.json({
        product: saved,
        season,
        manualPriceUsd: Number(manualPrice.toFixed(2)),
        message: `Importado ${saved.name} → temporada ${season} (precio manual)`,
      });
    }

    // precio sugerido: usar el validado vs competencia si es válido,
    // si no (no rentable contra competencia), caer al precio markup base.
    const mockProduct: Product = {
      id: opp.pid,
      name: opp.name,
      slug: opp.pid,
      priceUsd: opp.suggestedPriceUsd,
      costUsd: opp.costUsd,
      shippingMxUsd: opp.shippingMxUsd,
      shippingUsUsd: opp.shippingUsUsd,
      category: opp.category,
      images: opp.image ? [opp.image] : [],
    } as Product;
    const validation = await computeCompetitivePrice(mockProduct, opp.landedMx, opp.landedUs);
    const priceToUse = Number.isNaN(validation.priceUsd)
      ? opp.suggestedPriceUsd
      : Number(validation.priceUsd.toFixed(2));

    const product = await importCjProduct(opp.pid);
    product.priceUsd = priceToUse;
    product.featured = true;
    const saved = await upsertProduct(product);

    await addProductToSeason(season, saved.id);
    await setOpportunityStatus(opp.pid, "imported", { season });

    return NextResponse.json({
      product: saved,
      season,
      message: `Importado ${saved.name} → temporada ${season}${
        Number.isNaN(validation.priceUsd)
          ? " (precio markup; competencia más barata)"
          : " (precio competitivo)"
      }`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al aprobar" },
      { status: 500 }
    );
  }
}

/** Valida precios de competencia (CJ / Amazon / ML) on-demand para una oportunidad */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) {
    return NextResponse.json({ error: "Oportunidad no encontrada" }, { status: 404 });
  }

  // producto mock con nombre e imagen de la oportunidad
  const mockProduct: Product = {
    id: opp.pid,
    name: opp.name,
    slug: opp.pid,
    priceUsd: opp.suggestedPriceUsd,
    costUsd: opp.costUsd,
    shippingMxUsd: opp.shippingMxUsd,
    shippingUsUsd: opp.shippingUsUsd,
    category: opp.category,
    images: opp.image ? [opp.image] : [],
  } as Product;

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 12000);
  const competitors = await fetchCompetitorPrices(mockProduct, controller.signal);
  clearTimeout(to);

  const cmp = competitors.length
    ? competitors.reduce((a, b) => (a.priceUsd < b.priceUsd ? a : b))
    : null;
  const { priceUsd: adjustedPrice, reason } = await computeCompetitivePrice(
    mockProduct,
    opp.landedMx,
    opp.landedUs
  );

  // persistir datos de competidor en la oportunidad
  if (cmp) {
    await updateOpportunity(opp.pid, {
      competitorPriceUsd: cmp.priceUsd,
      competitorSource: cmp.source,
    });
  }

  const landedMax = Math.max(opp.landedMx, opp.landedUs);
  const feeRate = 0.036;
  const profit = adjustedPrice - landedMax - adjustedPrice * feeRate;

  return NextResponse.json({
    opportunity: opp,
    competitors,
    bestCompetitor: cmp,
    recommendedPriceUsd: Number.isNaN(adjustedPrice) ? null : Number(adjustedPrice.toFixed(2)),
    suggestedPriceUsd: opp.suggestedPriceUsd,
    profitUsd: Number(profit.toFixed(2)),
    marginPct: Number(((profit / adjustedPrice) * 100).toFixed(1)),
    reason,
  });
}
