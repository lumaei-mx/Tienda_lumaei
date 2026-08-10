import { readProducts, upsertProduct } from "@/lib/products-db";
import { listCatalogs, currentSeason, SEASONS } from "@/lib/catalog-db";
import { notifyOwner } from "./alert";

/**
 * Diseñador de catálogos: gestiona qué productos están activos según la
 * temporada vigente (calendario fijo anual). Corre en cron (diario).
 *
 * - Los productos asignados a un catálogo de temporada solo están activos
 *   durante esa temporada.
 * - Al cambiar de temporada, los productos de la temporada anterior se
 *   desactivan y los de la actual se activan.
 * - Productos sin asignación a catálogo (catálogo base / siempre-verde) se
 *   mantienen activos.
 */
export async function runCatalog(): Promise<{
  season: string | null;
  activated: number;
  deactivated: number;
  details: string[];
}> {
  const season = currentSeason();
  const catalogs = await listCatalogs();
  const products = await readProducts();
  let activated = 0;
  let deactivated = 0;
  const details: string[] = [];

  // asignación producto → temporada(s)
  const seasonOfProduct = new Map<string, string>();
  for (const c of catalogs) {
    for (const pid of c.productIds) seasonOfProduct.set(pid, c.season);
  }

  for (const p of products) {
    const assigned = seasonOfProduct.get(p.id);
    // sin asignación: siempre-verde, se respeta su estado
    if (!assigned) continue;

    if (assigned === season?.key) {
      if (!p.active) {
        p.active = true;
        await upsertProduct(p);
        activated++;
        details.push(`ON ${p.name} (${season.name})`);
      }
    } else {
      if (p.active) {
        p.active = false;
        await upsertProduct(p);
        deactivated++;
        details.push(`OFF ${p.name} (temporada ${assigned})`);
      }
    }
  }

  if (activated > 0 || deactivated > 0) {
    await notifyOwner(
      "catalog_season",
      `Catálogo temporada: ${season ? season.name : "entre temporadas"} · +${activated} activados · −${deactivated} desactivados.`,
      "info"
    );
  }

  return {
    season: season?.key || null,
    activated,
    deactivated,
    details: details.slice(0, 30),
  };
}

export function catalogSummary() {
  const current = currentSeason();
  return {
    current: current ? { key: current.key, name: current.name, emoji: current.emoji } : null,
    seasons: SEASONS.map((s) => ({
      key: s.key,
      name: s.name,
      start: s.start,
      end: s.end,
      emoji: s.emoji,
    })),
  };
}
