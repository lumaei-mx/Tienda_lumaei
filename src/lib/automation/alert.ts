import { storageGet, storageSet, isRedisAvailable } from "@/lib/storage";

const COLLECTION = "meta";
const DOC = "alerts";

export type AlertLevel = "info" | "warn" | "critical";

export interface Alert {
  id: string;
  level: AlertLevel;
  kind: string;
  message: string;
  createdAt: string;
  resolved?: boolean;
}

export async function listAlerts(): Promise<Alert[]> {
  if (!isRedisAvailable()) return [];
  try {
    const stored = await storageGet<Alert[]>(COLLECTION, DOC);
    return stored || [];
  } catch {
    return [];
  }
}

export async function pushAlert(
  kind: string,
  message: string,
  level: AlertLevel = "warn"
) {
  if (!isRedisAvailable()) return;
  const alerts = await listAlerts();
  const alert: Alert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    kind,
    message,
    createdAt: new Date().toISOString(),
  };
  alerts.unshift(alert);
  await storageSet(COLLECTION, DOC, alerts.slice(0, 200));
}

/**
 * Notificaciones al dueño. v1: registra en Redis (visible en /admin).
 * Fase S3 conecta Resend/WhatsApp aquí.
 */
export async function notifyOwner(kind: string, message: string, level: AlertLevel = "warn") {
  await pushAlert(kind, message, level);
}

export async function resolveAlert(id: string) {
  if (!isRedisAvailable()) return;
  const alerts = await listAlerts();
  await storageSet(
    COLLECTION,
    DOC,
    alerts.map((a) => (a.id === id ? { ...a, resolved: true } : a))
  );
}
