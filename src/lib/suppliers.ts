// Enrutamiento multi-proveedor por mercado (audit point 6: fulfillment localizado).
// Hoy solo CJ está integrado; Zendrop/Spocket son stubs hasta tener credenciales.
import type { Market, Product } from "./types";

export type SupplierId = "CJ" | "Zendrop" | "Spocket";

export interface SupplierCapability {
  id: SupplierId;
  name: string;
  /** Mercados que el proveedor puede servir. */
  markets: Market[];
  /** Prioridad por mercado: menor = más preferido. */
  priority: number;
}

export const SUPPLIERS: Record<SupplierId, SupplierCapability> = {
  CJ: { id: "CJ", name: "CJdropshipping", markets: ["MX", "US"], priority: 10 },
  Zendrop: { id: "Zendrop", name: "Zendrop", markets: ["US"], priority: 1 },
  Spocket: { id: "Spocket", name: "Spocket", markets: ["US", "MX"], priority: 2 },
};

/**
 * Selecciona el proveedor para un producto en un mercado.
 * - Si el producto declara `provenance.supplier` y sirve ese mercado, se respeta.
 * - Si no, elige el proveedor de mayor prioridad que sirva el mercado.
 * - CJ siempre es respaldo.
 */
export function selectSupplier(product: Product, market: Market): SupplierId {
  const declared = product.provenance?.supplier as SupplierId | undefined;
  if (declared && SUPPLIERS[declared]?.markets.includes(market)) {
    return declared;
  }
  const capable = (Object.values(SUPPLIERS) as SupplierCapability[])
    .filter((s) => s.markets.includes(market))
    .sort((a, b) => a.priority - b.priority);
  return capable[0]?.id ?? "CJ";
}
