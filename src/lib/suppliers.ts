// Enrutamiento multi-proveedor por mercado (audit point 6: fulfillment localizado).
// REGLA OPERATIVA v2: el cliente recibe desde su propio país cuando hay almacén local.
//   - US -> despacho desde US (rápido 2-5 días): CJ(US), Zendrop, Spocket, EPROLO, Sellvia.
//   - MX -> despacho desde MX (rápido). HOY: NINGÚN proveedor tiene almacén MX -> fallback
//     cross-border (CJ desde US/China, 15-25 días). Pendiente: conseguir 3PL/supplier MX.
// CJ sirve MX y US pero despacha desde US/China (no tiene almacén MX).
import type { Market, Product } from "./types";

export type SupplierId = "CJ" | "Zendrop" | "Spocket" | "EPROLO" | "Sellvia";

export interface SupplierCapability {
  id: SupplierId;
  name: string;
  /** Mercados que el proveedor entrega (destino). */
  markets: Market[];
  /** Regiones con almacén local (envío rápido). */
  shipFrom: Market[];
  /** Prioridad por mercado: menor = más preferido. */
  priority: number;
  /** true si aún falta credencial/integración. */
  stub?: boolean;
}

export const SUPPLIERS: Record<SupplierId, SupplierCapability> = {
  CJ: { id: "CJ", name: "CJdropshipping", markets: ["MX", "US"], shipFrom: ["US"], priority: 10 },
  Zendrop: { id: "Zendrop", name: "Zendrop", markets: ["US"], shipFrom: ["US"], priority: 2, stub: true },
  Spocket: { id: "Spocket", name: "Spocket", markets: ["US", "MX"], shipFrom: ["US"], priority: 3, stub: true },
  EPROLO: { id: "EPROLO", name: "EPROLO", markets: ["US", "MX"], shipFrom: ["US"], priority: 4, stub: true },
  Sellvia: { id: "Sellvia", name: "Sellvia", markets: ["US"], shipFrom: ["US"], priority: 5, stub: true },
};

/** ¿El proveedor despacha desde el país del cliente? (envío rápido local) */
export function isLocalFulfillment(id: SupplierId, market: Market): boolean {
  return !!SUPPLIERS[id]?.shipFrom.includes(market);
}

export function selectSupplier(product: Product, market: Market): SupplierId {
  const declared = product.provenance?.supplier as SupplierId | undefined;
  const pool = (Object.values(SUPPLIERS) as SupplierCapability[]).filter(
    (s) => s.markets.includes(market),
  );

  // 1) Proveedor declarado en el producto, si está configurado y sirve el mercado.
  if (
    declared &&
    !SUPPLIERS[declared]?.stub &&
    SUPPLIERS[declared]?.markets.includes(market)
  ) {
    return declared;
  }

  // 2) Prioriza fulfill local (shipFrom == market), luego cualquiera que sirva el mercado.
  const localFirst = pool
    .filter((s) => !s.stub)
    .sort((a, b) => {
      const al = a.shipFrom.includes(market) ? 0 : 1;
      const bl = b.shipFrom.includes(market) ? 0 : 1;
      if (al !== bl) return al - bl;
      return a.priority - b.priority;
    });
  const pick = localFirst[0] ?? pool.sort((a, b) => a.priority - b.priority)[0];
  return pick?.id ?? "CJ";
}
