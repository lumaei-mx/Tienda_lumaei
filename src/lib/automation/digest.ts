import { readOrders } from "@/lib/orders-db";
import { readStoreSettings } from "@/lib/settings-db";
import { formatMoney } from "@/lib/money";
import { listAlerts } from "./alert";
import { listOpportunities } from "@/lib/opportunity-db";
import { currentSeason } from "@/lib/catalog-db";

/**
 * Resumen diario: ventas 24h, profit estimado, pedidos por estado, alertas,
 * top oportunidades del hunter y temporada activa.
 * Lo dispara el cron digest (19:00 MX). En S3 se envía por email/WhatsApp.
 */
export async function runDigest(): Promise<{
  period: { from: string; to: string };
  orders24h: number;
  revenueUsd: number;
  profitUsd: number;
  byStatus: Record<string, number>;
  alerts: number;
  opportunities: number;
  topOpportunity?: string;
  season?: string | null;
}> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const orders = await readOrders();
  const s = await readStoreSettings();

  const recent = orders.filter(
    (o) => new Date(o.createdAt) >= since && o.status !== "pending_payment"
  );

  const revenueUsd = recent.reduce(
    (acc, o) => acc + (o.estimatedProfitUsd + o.cogsUsd + o.paymentFeeUsd),
    0
  );
  const profitUsd = recent.reduce((acc, o) => acc + o.estimatedProfitUsd, 0);
  const byStatus: Record<string, number> = {};
  for (const o of recent) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  const alerts = (await listAlerts()).filter((a) => !a.resolved).length;

  // oportunidades pendientes (top del hunter)
  const opportunities = await listOpportunities("new");
  const top = [...opportunities]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 1);
  const topOpportunity = top[0]
    ? `${top[0].name.slice(0, 30)} → $${top[0].profitUsd.toFixed(2)} profit`
    : undefined;
  const season = currentSeason();

  const body = [
    `Lumaei — resumen 24h`,
    `Pedidos: ${recent.length} · Ingresos: ${formatMoney(revenueUsd)} · Profit: ${formatMoney(profitUsd)}`,
    `Estados: ${Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    alerts > 0 ? `Alertas activas: ${alerts}` : "Sin alertas.",
    `Oportunidades hunter: ${opportunities.length}${topOpportunity ? ` · Top: ${topOpportunity}` : ""}`,
    season ? `Temporada: ${season.emoji} ${season.name}` : "Entre temporadas",
  ].join("\n");

  // v1: queda en Redis (visible /admin). S3 conecta canal de notificación.
  await import("./alert").then((m) => m.notifyOwner("digest", body, "info"));

  return {
    period: { from: since.toISOString(), to: new Date().toISOString() },
    orders24h: recent.length,
    revenueUsd: Number(revenueUsd.toFixed(2)),
    profitUsd: Number(profitUsd.toFixed(2)),
    byStatus,
    alerts,
    opportunities: opportunities.length,
    topOpportunity,
    season: season?.key ?? null,
  };
}
