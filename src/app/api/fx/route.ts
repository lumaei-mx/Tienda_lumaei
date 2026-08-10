// Proxy server-side del tipo de cambio USD→MXN en vivo.
// Fuente: open.er-api.com (gratis, sin key). Cache en memoria 10 min
// para no abusar del proveedor y para que el rate sea consistente
// entre visitas dentro de la misma ventana.
import { NextResponse } from "next/server";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const FALLBACK_RATE = 17.2; // respaldo si el proveedor falla

let cache: { rate: number; date: string; fetchedAt: number } | null = null;

async function fetchRate(): Promise<{ rate: number; date: string }> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: CACHE_TTL_MS / 1000 },
  });
  if (!res.ok) throw new Error(`fx provider ${res.status}`);
  const j = await res.json();
  const mxn = j?.rates?.MXN;
  if (typeof mxn !== "number" || !j?.time_last_update_utc) {
    throw new Error("fx provider payload inválido");
  }
  return { rate: mxn, date: j.time_last_update_utc };
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache);
  }
  try {
    const fresh = await fetchRate();
    cache = { ...fresh, fetchedAt: Date.now() };
    return NextResponse.json(cache);
  } catch {
    // No romper el checkout si el proveedor cae: devolver rate de respaldo.
    return NextResponse.json({
      rate: FALLBACK_RATE,
      date: new Date().toUTCString(),
      fetchedAt: Date.now(),
      fallback: true,
    });
  }
}
