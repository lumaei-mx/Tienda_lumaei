import { readOrders } from "@/lib/orders-db";
import { readProducts } from "@/lib/products-db";
import {
  listOpportunities,
  upsertOpportunity,
  type Opportunity,
} from "@/lib/opportunity-db";
import { notifyOwner } from "./alert";

/**
 * Evaluador de tendencias.
 *
 * Señales internas: ventas propias por categoría y producto (crecimiento en
 * ventana reciente vs. histórica, share de categoría).
 * Señales externas: trending topics de Google Trends (endpoint público, sin
 * clave) matcheados contra el nombre/categoría de cada oportunidad.
 *
 * Resultado: trendScore 0-100 por oportunidad, que el hunter usa como señal
 * (y el diseñador de catálogos para elegir productos). Corre cada 6h.
 */

// geo por mercado
const TRENDS_GEO = "US";

export async function runTrends(): Promise<{
  checked: number;
  lowStock: Array<{ id: string; name: string; sold: number; stock: number }>;
  scored: number;
  trendingKeywords: string[];
}> {
  const orders = await readOrders();
  const products = await readProducts();
  const byId = new Map(products.map((p) => [p.id, p]));

  // ---- señales internas: ventas por producto y categoría ----
  const sold = new Map<string, number>();
  const recentSold = new Map<string, number>();
  const since30d = Date.now() - 30 * 24 * 3600 * 1000;
  const categorySold = new Map<string, number>();
  const categoryRecent = new Map<string, number>();

  for (const o of orders) {
    if (
      o.status === "pending_payment" ||
      o.status === "cancelled" ||
      o.status === "failed"
    )
      continue;
    const isRecent = new Date(o.createdAt).getTime() >= since30d;
    for (const item of o.items) {
      sold.set(item.productId, (sold.get(item.productId) || 0) + item.qty);
      if (isRecent) {
        recentSold.set(item.productId, (recentSold.get(item.productId) || 0) + item.qty);
      }
      const p = byId.get(item.productId);
      if (p) {
        const cat = p.category || "General";
        categorySold.set(cat, (categorySold.get(cat) || 0) + item.qty);
        if (isRecent) {
          categoryRecent.set(cat, (categoryRecent.get(cat) || 0) + item.qty);
        }
      }
    }
  }

  // tendencia de categoría: creció el share en 30d
  const totalRecent = [...categoryRecent.values()].reduce((a, b) => a + b, 0);
  const catTrend = new Map<string, number>();
  for (const [cat, n] of categoryRecent) {
    const historical = (categorySold.get(cat) || 0) - n;
    const growth = historical > 0 ? (n - historical) / historical : n > 0 ? 1 : 0;
    catTrend.set(cat, Math.max(0, Math.min(1, growth)) * 100);
  }

  // ---- señales externas: Google Trends ----
  const trendingKeywords = await fetchTrendingKeywords();

  // ---- aplicar score a oportunidades ----
  const opportunities = await listOpportunities();
  let scored = 0;
  for (const opp of opportunities) {
    const score = scoreOpportunity(opp, {
      trendingKeywords,
      catTrend,
      categoryShare: totalRecent > 0 ? (categoryRecent.get(opp.category || "") || 0) / totalRecent : 0,
    });
    if (score !== opp.trendScore) {
      await upsertOpportunity({ ...opp, trendScore: score, score: recomputeScore(opp, score) });
      scored++;
    }
  }

  // ---- low stock (productos de nuestro catálogo) ----
  const lowStock: Array<{ id: string; name: string; sold: number; stock: number }> = [];
  for (const [productId, qty] of sold) {
    const p = byId.get(productId);
    if (!p || !p.cjProductId) continue;
    if (qty >= p.stock) {
      lowStock.push({ id: p.id, name: p.name, sold: qty, stock: p.stock });
    }
  }

  if (lowStock.length > 0) {
    await notifyOwner(
      "low_stock_trend",
      `${lowStock.length} producto(s) bajo stock: ${lowStock
        .map((l) => `${l.name} (vendidos ${l.sold}, stock ${l.stock})`)
        .join(", ")}`,
      "warn"
    );
  }

  if (scored > 0) {
    await notifyOwner(
      "trends_scored",
      `Tendencias: ${scored} oportunidades actualizadas con score. Trending: ${trendingKeywords
        .slice(0, 6)
        .join(", ")}`,
      "info"
    );
  }

  return { checked: products.length, lowStock, scored, trendingKeywords };
}

// ---- puntaje ----

function scoreOpportunity(
  opp: Opportunity,
  signals: {
    trendingKeywords: string[];
    catTrend: Map<string, number>;
    categoryShare: number;
  }
): number {
  let score = 0;
  const text = `${opp.name} ${opp.category || ""} ${opp.sku || ""}`.toLowerCase();

  // 1) keyword trending match (externo) — hasta 50 pts
  const matched = signals.trendingKeywords.filter((k) =>
    text.includes(k.toLowerCase())
  );
  score += Math.min(50, matched.length * 15);

  // 2) categoría con crecimiento (interno) — hasta 30 pts
  const cat = signals.catTrend.get(opp.category || "") || 0;
  score += (cat / 100) * 30;

  // 3) share de categoría en ventas recientes (interno) — hasta 20 pts
  score += Math.min(20, signals.categoryShare * 200);

  return Math.round(Math.min(100, score));
}

function recomputeScore(opp: Opportunity, trendScore: number): number {
  // score compuesto = ganancia + margen + tendencia + stock
  return Number(
    (opp.profitUsd * 2 + opp.marginPct / 5 + Math.min(opp.stock, 500) / 100 + trendScore / 2).toFixed(2)
  );
}

// ---- fuente externa: Google Trends público ----

let trendsCache: { at: number; keywords: string[] } | null = null;

export async function fetchTrendingKeywords(): Promise<string[]> {
  if (trendsCache && Date.now() - trendsCache.at < 3600_000) {
    return trendsCache.keywords;
  }
  try {
    const url = `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=300&geo=${TRENDS_GEO}&ns=15`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Lumaei)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`trends ${res.status}`);
    const raw = (await res.text()).replace(/^\)\]\}',?\s*/, "");
    const data = JSON.parse(raw) as {
      default?: {
        trendingSearchesDaily?: Array<{
          trendingSearches?: Array<{
            title?: { query?: string };
            formattedTraffic?: string;
          }>;
        }>;
      };
    };
    const list =
      data?.default?.trendingSearchesDaily?.[0]?.trendingSearches?.slice(0, 40) ||
      [];
    const keywords = list
      .map((t) => (t.title?.query || "").trim())
      .filter(Boolean)
      .slice(0, 25);
    trendsCache = { at: Date.now(), keywords };
    return keywords;
  } catch {
    return [];
  }
}
