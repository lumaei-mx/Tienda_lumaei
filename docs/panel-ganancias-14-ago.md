# Panel de Ganancias — Lo que Lumaei REALMENTE necesita
**Fecha:** 14-ago-2026 · **Estado:** 1 orden pagada ($14.76) en 13d, tráfico ≈ 0, meta 50 órdenes/30d

## 1. LO QUE SÍ SE CONSTRUYE (MVP, costo $0, esta semana)

El panel ya tiene pedidos/fulfillment/promos. Solo falta **una vista de ganancias con 3 tablas** en `/admin`:

### T1 · Comisiones de afiliados (lo más urgente — hay dinero que se debe pagar)
- Columnas: `ref` (@handle) · # órdenes · $ vendidos (subtotal USD) · comisión (15%) · status (pendiente/pagado)
- Fuente: `orders.ref` ya existe en cada orden (`?ref=@yosoyhachi` verificado en orders.json).
- Decisión que habilita: **pagar al influenciador hoy**, no en 30 días. Comisión = $ vendidos × 0.15.
- Botón "marcar pagada" + nota manual (pago es por transferencia, no por Stripe).

### T2 · Margen real por producto (con el doble cobro de envío — nadie lo ve hoy)
- El margen publicado es engañoso: (17.84−1.53)/17.84 = **91.4% bruto**.
- La fórmula que importa (órdenes 1× guante, MX):

```
MargenNetoReal% = [P + F_checkout − IVA − COGS − F_real_CJ − FeesStripe] / [P + F_checkout − IVA]

Guante MX (1 ud):
P=17.84  F_checkout=9.99  bruto=27.83
IVA 16% = 4.45  →  neto ex-IVA = 23.99
COGS CJ = 1.53 (peor caso; 0.80 mejor)
Flete real CJ MX = 6.67   (decisión 41: el precio EMBEBE ship_est 9.99 Y el checkout cobra 9.99 aparte)
Stripe = 2.9%×32.28 + $0.30 = 1.24
Profit = 23.99 − 1.53 − 6.67 − 1.24 = 14.55  →  MARGEN NETO REAL ≈ 60.7%
```

- **Insight decisivo:** margen neto real ≈ 60%, no 91%. Aun así sano (>25%). El doble cobro de flete aporta ~$13.31/orden MX ocultos (9.99 embebido + 9.99 checkout − 6.67 real) — **NO lo elimines sin subir el precio de otra forma**: es tu colchón.
- Guardrail en panel: cualquier producto con margen neto real < 25% se marca rojo.

### T3 · Fulfillment e incidencias
- Lista: órdenes pending_fulfillment con días transcurridos + tracking CJ.
- Regla visual: >48h sin fulfillment → rojo. Incidencias >10% del total → revisar producto.

**Revenue ya lo cubre Stripe Dashboard. NO duplicar.**

## 2. LO QUE NO SE CONSTRUYE HASTA $3K/MES

- ❌ Dashboards con gráficas / BI / KPI widgets bonitos
- ❌ Forecasting / proyecciones
- ❌ Reportes automáticos por email
- ❌ Cohortes, retention, LTV analytics
- ❌ Integraciones extra (GA4, Hotjar, etc.)

Regla: **si no decide una acción esta semana, no se construye.** Con 1 orden, un panel de 5 métricas es teatro.

## 3. LOS 3 REPORTES DE 10 MIN/SEMANA

| Reporte | Qué mirar (10 min) | Decisión si se cruza el umbral |
|---|---|---|
| R1 Comisiones | Órdenes agrupadas por `ref` | ≥1 venta con ref → **pagar comisión hoy**. Órdenes sin ref >70% durante campaña → problema de atribución (links rotos, falta `?ref=`) → corregir links |
| R2 Margen real | T2 por producto | Margen neto <25% → subir precio o quitar. Margen >70% + vol >10/mes → probar +5% (patrón probado 3/0, conf 0.75, avg +$237) |
| R3 Fulfillment | T3 + incidencias | Pending >48h → escalar CJ. Incidencias >10% → evaluar reemplazo de producto |

## 4. UNIT ECONOMICS DEL PROGRAMA DE AFILIADOS

**Sostenibilidad 15% + producto gratis (costos: COGS $1.53 + flete real ~$6.67 = ~$8.20):**

- Contribución por venta afiliada (1× guante MX): profit $14.55 − comisión $2.68 = **$11.87**
- Costo de reclutar/regalar producto por influencer: **~$8.20**
- **Break-even = 1 venta por influencer** (11.87 > 8.20). Con ER 30-40% en pet MX, es realista.
- vs CAC pagado (Meta pet MX ~$4-8/compra): el influencer break-even está en 1-2 ventas → **afiliados más baratos que ads** mientras consigas influencers que vendan.

**LTV por cliente (ticket $17.84):**
- LTV = profit por orden × órdenes/vida = $14.55 × 1.3 ≈ **$19** (pet tiene repetición baja; si haces consumible, sube).

**Ticket (bundle) vs volumen — decisión: BUNDLE primero.**
- 2 guantes en 1 orden: +$17.84 de ingreso por solo +$1.53 COGS (flete ya pagado) → margen salta de 60% a ~80%.
- Sube ticket con "compra 2, envío gratis" o "kit guantes + accesorio" ANTES de quemar CAC en volumen. Volumen solo cuando el embudo ya convierte a AOV ≥ $30.

## 5. RECOMENDACIÓN FINAL

**Esta semana ($0):** en `/admin`, suma las tablas T1 (comisiones por ref + botón pagada), T2 (margen neto real con fórmula de doble cobro, guardrail 25%) y T3 (días en fulfillment). Con eso tomas 3 decisiones por semana en 10 minutos. **NUNCA construir:** dashboards, BI, forecasting ni reportes automáticos antes de $3K/mes de revenue — y no tocar el doble cobro de envío: es el colchón que paga la operación hoy. Afiliados al 15% + producto gratis son sostenibles (break-even 1 venta) — prioriza bundling para subir ticket antes de pagar por volumen.
