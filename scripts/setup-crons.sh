#!/usr/bin/env bash
# setup-crons.sh — Crea los 7 jobs de Lumaei en cron-job.org (foco i1).
# Reversible: los jobs se pueden borrar desde el dashboard o via API.
# Requiere: CRONJOB_API_KEY (API key de cron-job.org) y CRON_SECRET (header x-cron-secret).
# Uso:
#   export CRONJOB_API_KEY=xxxx CRON_SECRET=yyyy BASE_URL=https://www.lumaei.com
#   bash scripts/setup-crons.sh
set -euo pipefail

: "${CRONJOB_API_KEY:?falta CRONJOB_API_KEY (API key de cron-job.org)}"
: "${CRON_SECRET:?falta CRON_SECRET (header x-cron-secret de las rutas)}"
BASE_URL="${BASE_URL:-https://www.lumaei.com}"
API="https://api.cron-job.org/jobs"
TZ="America/Mexico_City"
AUTH="$(printf '%s:' "$CRONJOB_API_KEY" | base64)"
HOURS_ALL=$(seq -s, 0 23 | tr -d '\n')

# Cada job: [nombre, path, horas, minutos, metodo]
# metodo: 0 = GET (cron-job.org), 1 = POST. Debe coincidir con el handler de la ruta.
# Rutas GET: hunter, digest. Rutas POST: sync-cj, reprice, retry-fulfill, trends, catalog.
JOBS=(
  "sync-cj|/api/cron/sync-cj|0|30|1"
  "reprice|/api/cron/reprice|1|0|1"
  "retry-fulfill|/api/cron/retry-fulfill|$HOURS_ALL|0,15,30,45|1"
  "trends|/api/cron/trends|0,6,12,18|0|1"
  "hunter|/api/cron/hunter|0,6,12,18|0|0"
  "catalog|/api/cron/catalog|0|0|1"
  "digest|/api/cron/digest|19|0|0"
)

echo "== Creando jobs en $BASE_URL ($TZ) =="
for entry in "${JOBS[@]}"; do
  IFS='|' read -r name path hours minutes method <<< "$entry"
  url="$BASE_URL$path"
  body=$(cat <<JSON
{
  "job": {
    "url": "$url",
    "enabled": true,
    "schedule": {"timezone": "$TZ", "hours": [${hours}], "minutes": [${minutes}]},
    "requestMethod": ${method},
    "headers": [{"name": "x-cron-secret", "value": "$CRON_SECRET"}]
  }
}
JSON
)
  echo "-- $name -> $url"
  curl -sS -X POST "$API" \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json" \
    -d "$body" | sed 's/"value":"[^"]*"/"value":"***"/'
  echo
done

echo "== Contrato de verificación =="
echo "Por cada job en cron-job.org -> 'Run job' debe devolver HTTP 200 y JSON con {\"checked\":N,...}."
echo "Sin el header x-cron-secret devuelve 401 (auth correcta)."
echo "Monitoreo: $BASE_URL/api/health"
