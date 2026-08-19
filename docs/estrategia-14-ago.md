# Estrategia Lumaei — Soluciones ejecutables (14 Ago 2026)

> **Objetivo:** 50 órdenes / 30 días (hoy: día 13, 1 orden real = Michael García US, $14.76). Tráfico ≈ 0.
> **Reglas:** CAC $0 · costo total $0 · todo reversible · nada de teoría, solo acciones con dueño, plazo, métrica y umbral de decisión.
> **Base:** patrones en memoria — "P0 (traducción+trust) antes que P1 (tráfico)" (conf 0.7) y "bajo ticket visual outperformea en tráfico frío" (conf 0.65). La landing debe convertir ANTES de empujar tráfico.
> **Orden de ejecución:** §1 confianza (P0) → §2 panel (P0) → §3 tráfico TikTok (P1) → §4 secuencia priorizada.

---

## 1. Estrategia de confianza tipo Amazon (aplicada a tienda propia)

Principios Amazon que CONVIERTEN: riesgo de compra ≈ 0, cero fricción, prueba social visible en el punto exacto de decisión. Cada principio → acción concreta, ordenada por impacto/esfuerzo.

### a) Consistencia total de prueba social — ELIMINAR contradicción grid vs PDP

**Problema:** el grid del catálogo dice "4.5 · Nuevo" y la PDP dice "4.7 · 31 reseñas". Un visitante que ve ambos pierde confianza al instante. Además: "31 reseñas" es seeded (inventado), y la regla de oro del propio docs/tiktok-operativo.md dice **"Cero reseñas inventadas"**. Con influencers vivos en la tienda (hoy empiezan los DMs), cualquiera con 1 orden real y 31 reseñas aparentes es un riesgo de exposición pública.

**Decisión (recomendada): mostrar "Nuevo" en AMBOS, y reemplazar las 31 seeded por las 3 reseñas reales + garantía + envío en la PDP.**
- Por qué: (1) "Nuevo" es normal y esperado en una tienda con tráfico frío — no genera sospecha; (2) el riesgo de que un tiktoker o un comentarista exponga "31 reseñas con 1 sola venta" destruye la confianza que Amazon construye, y con 130K de alcance en juego no se juega; (3) la conversión no depende del número sino de la señal visible (reseñas reales + garantía + badges); (4) es la opción 100% reversible y 100% honesta, alineada con la regla del doc operativo.
- **Fallback si el dueño insiste en rating:** poner "Nuevo" en ambos y NUNCA un conteo inventado. Prohibido dejar el mismatch.

**Acciones:**
1. Grid del catálogo: dejar "Nuevo" (ya está bien).
2. PDP del guante (y resto de productos): quitar el bloque "31 reseñas" / rating 4.7; mostrar "Nuevo" + badge "Envíos MX/US" + "Garantía 30 días" + "3 reseñas de clientes reales".
3. Verificar en preview que grid y PDP ya no se contradicen (mismo texto de estatus).
- **Dueño:** @ing_ia (agente). **Plazo:** 1 día. **Métrica:** 0 menciones de "31 reseñas" en prod; grid y PDP consistentes. **Costo:** $0. **Reversible:** sí (guardar texto anterior).

### b) Meta description ES por PDP (accionable para @ing_ia)

**Formato por PDP (21 productos):**
- **Title tag:** 50–60 chars. Fórmula: `[Producto] | [Beneficio] – Lumaei`.
- **Meta description:** 140–160 chars. Fórmula: `[Keyword principal + problema que resuelve] [uso/ocasión] [envíos + garantía] – Lumaei`. Keyword en los primeros 40 chars. Sin precio (cambia).

**Ejemplo exacto (guante pet, slug `silicone-dog-bath-massage-gloves-...`):**
- Title: `Guantes de Baño para Mascotas | Masaje y Pelo Suelto – Lumaei` (57 chars)
- Meta: `Baña a tu perro sin peleas: guantes de silicón con masaje que levantan el pelo suelto y hacen espuma. Envíos a MX y US con garantía. – Lumaei` (158 chars)

**Acciones:**
1. Generar title + meta para los 21 productos con la fórmula (productos pet primero: guante, spray calma, cepillo vapor, peine).
2. Deploy y verificación: 21 metas ES visibles en `<head>` (curl/grep).
- **Dueño:** @ing_ia. **Plazo:** 1 día. **Métrica:** 21/21 metas ES en prod, 0 metas en copy CJ inglés. **Costo:** $0.

### c) Email capture: lead magnet "5 gadgets que te ahorran 1h al día"

Hoy NO existe captura: se regala el activo del comprador. Flujo completo, sin gasto:

**Cuándo pedir email:**
- **No-buyers:** popup exit-intent (desktop: mouse sale del viewport; mobile: 25s de scroll) con el lead magnet. Nunca pre-checkout — el checkout es el peor momento para fricción.
- **Buyers:** NO pedir email extra — Stripe ya lo tiene. El post-compra lo agrega a la secuencia automáticamente.

**Herramienta ($0):** Resend free tier (3,000 emails/mes, 100/día) + 1 route `/api/suscribir` + 1 página lead magnet `/guia/5-gadgets` + componente popup + hook en página de éxito de orden (o webhook Stripe) para buyers.

**Copy exacto:**
- Popup headline: `5 gadgets que te ahorran 1h al día (en serio)`
- Sub: `La lista que ya uso en casa. Gratis, sin spam.`
- Botón: `Enviármelo gratis`
- Confirmación: `Revisa tu correo 📩`
- Email subject: `Tu lista: 5 gadgets que te ahorran 1h al día`
- Email body: 1 párrafo + link a `/guia/5-gadgets` (la guía enlaza a 5 productos → también es SEO).
- **Post-compra (3 emails, tag `comprador`):** Día 0 gracias + tracking · Día 3 lead magnet + cross-sell guante pet · Día 10 pedido de reseña (alimenta las 3 reseñas reales honestas).

**Acciones:** 1) route + popup + guía, 2) hook post-compra, 3) deploy y prueba (suscribirse en preview).
- **Dueño:** @ing_ia. **Plazo:** 2 días. **Métrica:** ≥5 suscriptores en las primeras 48h con tráfico real. **Costo:** $0. **Reversible:** sí (quitar componente).

### d) Hero product: landing dedicada del guante pet

Página `/guantes-bano-mascotas` (slug ES). El guante ($17.84, margen >90%) es el producto estrella: el asset Reel 1 ya existe y los 4 DMs Tier A lo promocionan. Estructura de la landing (una sola página, CTA único):

1. **H1 problema→beneficio:** "Baña a tu perro sin peleas" (no "Guantes de silicón").
2. **Video hero:** embed del asset `public/tiktok/reel1-asmr.mp4` (ASMR ya existe, cero grabación).
3. **Proof bar (visible sin scroll):** "Nuevo · 3 reseñas de clientes reales · Garantía 30 días · Envíos MX/US".
4. **Producto + CTA único:** precio `$17.84 USD`, botón "Comprar ahora" → PDP (con `?ref` preservado si viene de influencer).
5. **Cómo funciona (3 pasos):** masaje → espuma → adiós pelo suelto (con las 5 imágenes reales CJ).
6. **3 reseñas reales** (ver §e), con nombre/país y badge "compra verificada".
7. **Bundle sugerido (AOV):** guante + Spray de Calma ($17.63) = $32.14 con 10% de descuento bundle (botón único "Llévate el combo").
8. **FAQ (5 preguntas):** ¿sirve para gatos? · ¿se limpia? · ¿envíos a MX/US? · ¿garantía? · ¿tallas? — responder con copy honesto, sin claims falsos.
9. **CTA final + trust badges** (pago seguro, envío rastreable, garantía).

**Regla:** la landing NO navega al resto del catálogo hasta después del CTA (cero dispersión).
- **Dueño:** @ing_ia. **Plazo:** 2 días. **Métrica:** ≥3% de visitantes de TikTok que aterrizan aquí llegan al checkout. **Costo:** $0. **Reversible:** sí (ruta nueva, no toca PDP).

### e) Uso de las 3 reseñas reales honestas — política de reviews

**Política (a partir de hoy):**
1. Las 3 reseñas reales son las ÚNICAS que se muestran en PDP y landing. Sin filtros de edición (salvo ortografía), con nombre + país + badge "compra verificada".
2. Retirar TODO conteo seeded ("31 reseñas"). Regla operativa: si el equipo no puede probar la compra, no se muestra.
3. Nada de reseñas incentivadas (cero "reseña a cambio de descuento") — mismo estándar legal MX/US y evita el hoyo que abriría un tiktoker.
4. Futuro: cada compra genera el email día 10 pidiendo reseña (ver §1c). Nuevas reseñas se agregan en <24h.
5. Si alguien (influencer, comentarista) cuestiona el conteo: respuesta honesta "somos tienda nueva, estas son reseñas de clientes reales" — el posicionamiento honesto convierte mejor que un número inflado.
- **Dueño:** dueño humano decide, @ing_ia ejecuta. **Métrica:** 0 reseñas sin compra verificada visibles. **Costo:** $0.

---

## 2. Estrategia de panel administrativo mínimo para ganancias

**Qué es el panel mínimo:** lo que ya existe en `/admin` (login, pedidos, refs de afiliados, settings, fulfillment) es SUFICIENTE para operar. No se construye más UI; se construyen 3 reportes que responden 3 preguntas de dinero.

**Los 3 reportes que SÍ valen (agente los genera semanal, no dashboard en vivo):**
1. **Órdenes por ref (pagar comisiones):** pedidos agrupados por `affiliateRef`, con estatus (pagado/cumplido), suma de revenue y comisión 15% calculada. **Decisión:** pagar comisión SOLO sobre órdenes pagadas y cumplidas; si una ref llega a ≥2 órdenes → enviar producto gratis de regalo y pedir 2º video (nutrir el canal que ya trae plata).
2. **Margen por producto:** por SKU: precio, costo CJ real (del panel CJ), envío, margen %, ventas. **Decisión:** ocultar productos con margen <50% o 0 ventas en 30 días; empujar el hero (guante, >90% margen).
3. **Incidencias/fulfillment:** órdenes sin cumplir >48h, tracking faltante, refunds/chargebacks. **Decisión:** resolver en <24h; >2 chargebacks/semana → pausar promoción de ese producto (riesgo de pago).

**Qué NO construir hasta ~$3K/mes de revenue:** dashboards de vanidad en tiempo real, cohort/retention, A/B testing infra, CRM, automatización de email (Resend manual basta), sync de inventario, multi-divisa, perfiles de cliente.

**Reporte semanal de 10 minutos (lunes 9:00, dueño + agente):**
1. **Órdenes:** count + revenue + por ref. Si 0 órdenes vs semana previa → duplicar el canal que trajo clics (no cambiar de canal); si refs ≥2 órdenes → pagar comisiones ese mismo día.
2. **Funnel TikTok:** views→clicks y clicks→add-to-cart. Umbrales: views→clicks <1.2% → iterar hooks/CTA del reel (no la tienda); add-to-cart <1.5% → el problema es la PDP/landing → iterar landing (no el contenido).
3. **Margen top 5 SKU:** hero <20 ventas/semana → revisar landing; SKU 0 ventas 30d → ocultar.
4. **Fulfillment:** pendientes >48h >2 → parar promoción hasta resolver.
5. **Decisión única:** elegir UNA acción para la semana. Si no hay decisión clara, la acción es "seguir publicando el calendario TikTok sin cambios".

---

## 3. Estrategia TikTok — plan de ejecución de 7 días con dueños

Convierte docs/tiktok-operativo.md en ejecución. Hoy = viernes 14-ago. Todo tiene dueño (H = humano/dueño, A = agente), tiempo, métrica y umbral de decisión.

### Día 0 — Hoy viernes 14 (H: 40 min total)
Las 3 acciones del dueño que desbloquean TODO (instrucciones exactas):
1. **Convertir a Business (2 min):** app TikTok → Perfil → ☰ → Ajustes → Cuenta → "Cambiar a cuenta comercial" → categoría **Tienda en línea**. Al terminar avisar al agente → agrega el link en bio (`https://www.lumaei.com`) y verifica.
2. **Fondear CJ orden f589 (10 min):** CJ panel → Órdenes → localizar f589 → pagar/fondear para liberar envío. Esto desbloquea el primer cumplimiento (y habilita enviar producto gratis a influencers aceptados). Verificar que el tracking aparezca en /admin.
3. **Enviar los 4 DMs TIER A (30 min):** copy-paste de docs/pitches-influencers-t4.md → `@yosoyhachi`, `@elovak`, `@africacontreras`, `@mariamonicamtz` (links ya verificados HTTP 200 con `?affiliateRef=`). Si un DM no es editable por privacidad, enviar vía TikTok normal (no pagar por ver).
4. **Publicar Reel 1 (5 min, 21:00–22:00 CDMX):** asset listo `public/tiktok/reel1-asmr.mp4` (18s, verificado). Caption, hashtags y portada en §2 del doc operativo. Primera hora: responder TODOS los comentarios y pinear "¿Tu perro también huye de la tina? 🛁 comenta 👇".
- **Métrica de éxito:** 4/4 completado hoy. **Umbral de decisión:** si no hay Business ni CJ hoy, el plan P1 no arranca (se mantiene P0: §1) — no quemar tráfico con una tienda sin confianza.

### Día 1 — Sábado 15 (A: 15 min; H: 30 min)
- A: verificar Business + agregar link en bio + verificación de que `?affiliateRef=` aparece en las órdenes del día.
- H: 3 tandas de comentarios (10 min c/u: 09:00, 14:00, 21:00). A quien pida link → DM con link `?ref=@lumaei.mx` (sin ref si es orgánico, ref solo para influencers).
- **Métrica:** 100% de comentarios respondidos <2h. **Umbral:** si el reel muere (<500 views a 24h) → agente prepara variante de portada/hook para re-publicar en día 3 (no borrar el original).

### Día 2 — Domingo 16 (H: 20 min; A: 30 min)
- H: **seguimiento +48h a los 4 DMs** con template (copiar de §Seguimiento del doc de pitches): "Hola [nombre], te reenvío esto por si se perdió — [ángulo nuevo del producto]. ¿Te interesa que te lo enviemos gratis?"
- A: preparar asset Reel 2 (dispensador — asset ya generado `reel2-dispensador.mp4`) + captions/portada; validar link PDP dispensador 200.
- **Métrica:** 4 seguimientos enviados. **Umbral:** ≥1 respuesta de influencer → preparar envío gratis (CJ) + confirmar ref.

### Día 3 — Lunes 17 (A: 20 min; H: 10 min)
- A: **medición 48h Reel 1** contra umbral seed: ≥3,000 views · ≥60 clics · ≥30 guardados.
- **Decisión (regla):** SI pasa umbral → H graba reels 2–5 (Plan A con perro real, mejor hook) y H publica Reel 2 (asset) a las 12:30 pm; SI no pasa → iterar hook/CTA de Reel 1, re-publicar variante en 48h, NO grabar el resto aún.
- H: publicar Reel 2 (12:30 pm CDMX).

### Día 4 — Martes 18 (A: 30 min; H: 30 min)
- A: primer reporte de atribución: clics → sesiones → órdenes (cart.ref / `?ref`); cruzar con pixel TikTok.
- H: primeros posts de VALOR en grupos FB + Reddit MX (r/Mascotas, grupos "Perros México", "Mascotas CDMX"): post de problema/solución (sin link), link solo cuando pidan. 3 posts.
- **Métrica:** ≥3 posts publicados, ≥10 clics atribuidos. **Umbral:** si algún grupo banea links → solo contenido + DM.

### Día 5 — Miércoles 19 (A: 15 min; H: 10 min)
- A: medición 48h Reel 2.
- **Regla de escalado Spark Ads:** SOLO si 2–3 reels validan el umbral seed (views ≥3,000 y views→clicks ≥1.2%) → entonces (con presupuesto futuro aprobado por dueño, fuera de esta fase $0) crear campaña Spark Ads con el mejor reel. Hoy NO se gasta nada.
- H: publicar Reel 3 (lámpara hongo, 8:30 pm) — grabar Plan A o usar assets.

### Día 6 — Jueves 20 (H: 30 min; A: 30 min)
- H: responder DMs de influencers; si hay aceptados → coordinar dirección + producto gratis (CJ, ya fondeado) y confirmar que su link `?ref=@handle` funciona antes de enviar.
- A: preparar kit de seguimiento por influencer (confirmación de envío + instrucción "muestra cómo lo usas, sin guion").

### Día 7 — Viernes 21 (H: 10 min; A: 30 min)
- **Regla de escalado TikTok Shop:** SOLO si el guante pet (o un producto) supera $1K/mes de revenue → evaluar TikTok Shop MX (comisiones de plataforma). Hoy NO.
- H: reporte semanal de 10 min (§2) + publicar Reel 4 (12:30 pm).
- A: registrar resultados en memoria (kpis + reinforce de patrones).

**Cómo el ref de afiliado cierra el loop (cadena completa):** influencer publica → su audiencia toca link `https://www.lumaei.com/productos/...?affiliateRef=@handle` → la tienda persiste el ref en la orden → la orden aparece en /admin/pedidos con su ref → el reporte semanal calcula la comisión 15% → se paga y se le pide 2º video. Si el ref NO aparece en una orden, no se paga comisión (regla clara para evitar abuso).

---

## 4. Secuencia de ejecución priorizada

| # | Estrategia / Acción | Dueño | Plazo | Métrica de éxito | Costo |
|---|---|---|---|---|---|
| 1 | **Día 0 TikTok: Business + fondear CJ f589 + 4 DMs + publicar Reel 1 (21h CDMX)** | Humano | Hoy | 4/4 completado; Reel live | $0 |
| 2 | **Consistencia social proof: "Nuevo" en grid+PDP, quitar 31 seeded, mostrar 3 reales** | Agente | 1 día | 0 contradicciones en prod | $0 |
| 3 | **Meta descriptions ES en 21 PDPs** | Agente | 1 día | 21/21 metas ES | $0 |
| 4 | **Email capture: Resend + popup exit-intent + /guia/5-gadgets + secuencia post-compra** | Agente | 2 días | ≥5 suscriptores en 48h con tráfico | $0 |
| 5 | **Landing hero guante /guantes-bano-mascotas + bundle 10%** | Agente | 2 días | ≥3% aterrizaje→checkout | $0 |
| 6 | **Responder comentarios Reel 1 (3 tandas/día)** | Humano | Días 0–1 | 100% respondidos <2h | $0 |
| 7 | **Seguimiento +48h de los 4 DMs** | Humano | Día 2 | 4 enviados; ≥1 respuesta | $0 |
| 8 | **Medición 48h Reel 1 → decidir grabar reels 2–5** | Agente | Día 3 | ≥3,000 views / ≥60 clics / ≥30 guardados | $0 |
| 9 | **Posts valor FB/Reddit MX (3/semana)** | Humano | Días 4–7 | ≥3 posts, ≥10 clics | $0 |
| 10 | **Reporte semanal 10 min: órdenes por ref, margen, fulfillment** | Agente | Día 7 | 1 decisión única documentada | $0 |

**Regla general:** la fila 1 desbloquea el mayor EV hoy (es el único camino a tráfico CAC $0 con todo el material listo). Las filas 2–5 son P0 (confianza) y deben estar deployadas ANTES de que el Reel 1 traiga tráfico sostenido — no quemar impressions en una tienda que todavía se contradice.

---

*Documento ejecutable generado por @gm-estrategia. Todo es $0 y reversible. Resultados se registran en memoria (lumaei-intelligence) y se refuerzan patrones según outcome real.*
