# Lumaei — Plan de Crecimiento 30 días (objetivo: 50 órdenes, $0 ads)

**Diagnóstico:** tráfico 0 + conversión rota (copia CJ en inglés, 0 reseñas, sin trust badges, sin bundles, sin free shipping threshold). Cuello de botella #1 = visibilidad; cuello de botella #2 = confianza en checkout.

**Memoria consultada:** growth patterns = vacío (primera operación). Stack del README confirma margen blended 55–71% en los 4 SKUs → CAC < LTV/3 es alcanzable con CAC $0 (orgánico).

---

## P0 — Hacer esta semana (Quick Wins)

1. **Traducir y reescribir las 4 PDPs al español MX** (hook emocional + beneficios, no specs). FAQ de 4 preguntas. Bullets de objeciones (envío, devoluciones, pago seguro).
2. **Trust badges + shipping threshold**: añadir barra "Envío gratis desde $50 USD" + 4 badges (pago seguro Stripe, garantía 30 días, tracking, soporte WhatsApp).
3. **Bundle "Kit Cocina Viral"** = Exhaust Fan + Wardrobe Organizer (precio bundle $69 USD vs $74.20 separados). Hook: "Ordena tu cocina en 1 click". AOV +$15.
4. **Reviews seeding**: importar 3 reseñas reales por producto (con foto del cliente — placeholder honesto o de亲友) hasta llegar a primera review orgánica. Badge "Recién llegado · 0 reseñas" → quitar en cuanto se acumulen.
5. **TikTok Lumaei**: crear 3 cuentas regionales (MX principal, US secundario, "lumaei_drops"). Publicar 5 reels seed esta semana (no venta directa — puro valor/transformación).

## P1 — Semanas 2-3 (Escalamiento viral)

### Contenido por producto (formato → ángulo)

| Producto | Potencial viral | Formato primario | Hook 0-3s | CTA |
|---|---|---|---|---|
| **Desktop Exhaust Fan** ($14.48) | ⭐⭐⭐⭐⭐ ASMR cocina | Reel "antes/después humo" 15s | "Tu cocina llena de humo — solved" | Link bio |
| **Phone Stand AI tracking** ($14.51) | ⭐⭐⭐⭐⭐ Creator hook | Reel "tiktoker descubre auto-tracking" | "Grabas solo, el celular te sigue solo" | Link bio |
| **Wardrobe Organizer** ($59.72) | ⭐⭐⭐ Transformación | Reel "clóset caótico → minimalista 30s" | "De 200 piezas de ropa a esto" | Bundle |
| **Pet Feeder** ($48.39) | ⭐⭐⭐ Mascotas | Reel POV "gato/perro come solo a su hora" | "Mi gato ya come sin mí" | Single |

**Frecuencia:** 4 posts/semana × 3 cuentas = 12 publicaciones/semana. 70% valor/UGC, 20% transformación, 10% oferta directa. **Duetos y stitches** con audios trending de organización MX ("That Girl aesthetic", "limpieza profunda").

### Partnerships / Afiliados (sin costo)

- **10 micro-influencers MX/semana** (1k–30k followers, nicho: hogar/cocina/mascotas/creator gear). Pitch: producto gratis + 15% comisión por venta tracked (link único con `?ref=`).
- **1-2 cruces con cuentas de tips de cocina** tipo @cocina_con_lupita o perfiles similares — producto gratis a cambio de story + link.
- **Reddit MX / Facebook groups** (grupos "Organización del hogar MX", "Mascotas MX") — perfil útil + value-first, 1 post/semana por grupo. Cero spam.

### SEO básico (4 páginas)

- Reescribir H1 con keyword long-tail ES: "Dispensador automático de comida para mascotas México", "Extractor de humo cocina portátil USB", "Soporte celular con tracking facial para creadores", "Organizador de ropa colgante para clóset".
- Meta description + OG image por PDP. Schema `Product` con `price`, `availability`, `aggregateRating` (cuando llegue review real).
- 1 artículo blog "Las 5 gadgets de cocina que volaron en TikTok 2026" enlazando a fan + organizer.

## P2 — Semana 4 (Iteración + add-on)

- **Evaluar LED Jellyfish Lamp** ($40.96 profit según hunter CJ) si la cohorte 0-30d valida el funnel. NO añadir antes de tener 10 órdenes.
- **Email capture** con lead magnet "5 gadgets que te ahorran 1h al día" → pop-up exit-intent.
- **TikTok Spark Ads** sobre los 2-3 reels orgánicos top (sólo si están validando — $5-10 USD boost, fuera del presupuesto base).

---

## Bloqueos de conversión visibles (resolver antes de pagar tráfico)

| Bloqueo | Estado actual | Acción |
|---|---|---|
| Copia en inglés | ❌ | Traducir + localizar MX |
| 0 reseñas | ❌ | Seed 3-5 por producto |
| Sin trust badges | ❌ | Stripe + 30d + tracking + WS |
| Sin bundle | ❌ | Kit Cocina Viral |
| Sin free shipping threshold | ❌ | Free ship $50+ |
| Imágenes CJ crudas | ⚠️ | 1 foto lifestyle por producto |
| CTA checkout Stripe real | ⚠️ | Validar que esté conectado (verificar) |

## KPIs — 5 métricas con target semanal

| # | Métrica | W1 | W2 | W3 | W4 (meta) |
|---|---|---|---|---|---|
| 1 | **Sesiones únicas** | 200 | 600 | 1,000 | 1,500 |
| 2 | **Add-to-cart rate** | 1.5% | 2.0% | 2.5% | 3.0% |
| 3 | **Checkout-start rate** | 0.3% | 0.5% | 0.8% | 1.0% |
| 4 | **Conversión global** | 0.0% | 0.5% | 1.0% | 1.5% |
| 5 | **Órdenes pagadas** | 0 | 5 | 15 | **30** (acum 50) |

**Asunción de sensibilidad:** si W2 add-to-cart <1.2%, el problema es producto/copy → iterar antes de escalar contenido. Si add-to-cart >2% pero conversión <0.3%, el problema es checkout/confianza → push reviews + badges.

**Tracking:** TikTok Pixel (test mode) en PDP + ATC + InitiateCheckout + Purchase. Event IDs en `src/lib/tiktok-pixel.ts` (verificar).

## Riesgos

- **CJ shipping time MX 7-15d** puede matar conversion. Mitigación: comunicar "fulfillment automático 24-48h + tracking" explícitamente en PDP.
- **Cero reseñas = cero confianza** → seed reviews honestas es crítico antes de escalar tráfico.
- **Productos nuevos, mercado nuevo** → esperar 14 días de datos antes de cualquier conclusión.

---
**Costo total:** $0. **Reversible:** sí (todo es contenido/UX). **Validación:** revisión semanal W1/W2/W3/W4 contra KPIs.
