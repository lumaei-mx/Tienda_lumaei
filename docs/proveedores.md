# Estrategia de proveedores — Lumaei (v2)

**Regla de oro:** cliente en México → despacho desde México; cliente en EE. UU. → despacho desde EE. UU. Envío rápido y barato por país. Solo productos económicos con margen real tras comisión de influencer (15%).

## Hallazgos de investigación (ago 2026)
- **EE. UU. tiene buena infraestructura local:** almacenes nacionales con entrega 2–5 días.
- **México barely tiene dropshipping local:** guías confirman que casi no hay proveedores con almacén en MX; CJ **no tiene** almacén MX. Mercado Libre domina la última milla en MX.
- Conclusión: US es viable ya; **MX es el cuello de botella** y requiere una solución concreta (3PL mexicano o proveedor con inventario en MX).

## Proveedores evaluados (shipFrom = almacén local)
| Proveedor | Sirve | Almacén local | Notas |
|---|---|---|---|
| CJdropshipping | MX, US | US (3) | El que usamos hoy. MX queda cross-border 15–25 días. |
| Zendrop | US | US | 2–5 días US. Stub (falta credencial). |
| Spocket | US, MX | US, EU | 6–7 días. Stub. |
| EPROLO | US, MX | US, EU | branding + 3PL US. Stub. |
| Sellvia | US | US (California) | 2–5 días US. Stub. |

## Acción requerida para MX
1. Conseguir un **3PL o proveedor con inventario físico en México** (o usar fulfillment de Mercado Libre / un prep-center MX).
2. Mientras tanto: MX se cumple desde almacén US de CJ (más lento). Señalar clearancing de envío en la PDP para MX.
3. Stock de best-sellers en el almacén local del país correspondiente para cortes de 2–5 días.

## Modelo en código
`src/lib/suppliers.ts`:
- `selectSupplier(product, market)` prioriza `shipFrom == market` (fulfill local).
- `isLocalFulfillment(id, market)` indica si el envío será local/rápido.
- Stubs (Zendrop/Spocket/EPROLO/Sellvia) no se eligen hasta tener credenciales.
