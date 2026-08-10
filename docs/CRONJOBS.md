# Automatización Lumaei — Scheduler cron-job.org

La tienda se opera 24/7 sin intervención manual. Los webhooks de Stripe, CJ y
TikTok son push (los envían ellos solos). Los **crons** hacen mantenimiento
periódico. Vercel Hobby limita los crons nativos (2/día), por eso usamos
**cron-job.org** (gratis, sin límite práctico).

## Credenciales

| Variable | Propósito | Dónde está |
|---|---|---|
| `CRON_SECRET` | Header de autorización de los crons | Vercel (production) + header de cada job en cron-job.org |
| `ADMIN_PASSWORD` | Login /admin | Vercel (production) — rotada el 2026-08-07 |
| `ADMIN_SECRET` | Firma de cookie admin | Vercel (production) — rotada el 2026-08-07 |

**NUNCA escribas valores reales en este documento.** Si rotas `CRON_SECRET`,
actualiza el header `x-cron-secret` de los 7 jobs en cron-job.org en el mismo
momento (si no, los crons fallan con 401).

## Jobs a crear en cron-job.org

Para cada job:
1. En **Request**: URL, método **GET**.
2. En **Request → Custom Headers**: añadir header `x-cron-secret` con el valor
   de `CRON_SECRET` (cópialo desde Vercel → Settings → Environment Variables;
   no lo guardes en este documento).
3. En **Schedule**: frecuencia indicada.
4. En **Advanced → Timezone**: `America/Mexico_City` para los horarios.

| Job | URL | Frecuencia |
|---|---|---|
| 8194392 | Sync CJ (stock/costo/freight) | Diario 00:30 |
| 8194393 | Repricing automático | Diario 01:00 |
| 8194394 | Retry fulfill (colas CJ) | Cada 15 min |
| 8194395 | Tendencias / stock bajo | Cada 6 h |
| 8197375 | Hunter de oportunidades | Cada 6 h |
| 8197378 | Catálogos por temporada | Diario 00:00 |
| 8194396 | Resumen diario (digest) | Diario 19:00 |

## Validación

Probar cada job manualmente desde cron-job.org ("Run job"). Debe devolver JSON
con `{"checked":N,...}` y código 200. Sin el header da **401**.

## Monitoreo

- `https://www.lumaei.com/api/health` — estado Redis/Stripe/CJ.
- Alertas de fallos de fulfill quedan en Redis (visibles en `/admin`).
- cron-job.org manda email si un job falla (activar notificaciones por job).

## Reintentos (último intento, asegurar)

| Job | Reintentos | Intervalo |
|---|---|---|
| sync-cj | 3 | 10 min |
| reprice | 2 | 15 min |
| retry-fulfill | 5 | 5 min |
| trends | 3 | 10 min |
| hunter | 3 | 10 min |
| catalog | 2 | 15 min |
| digest | 2 | 15 min |
