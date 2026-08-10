import { settings as staticSettings } from "./settings";
import { storageGet, storageSet, isRedisAvailable } from "./storage";
import type { StoreSettings } from "./types";

const COLLECTION = "meta";
const DOC = "settings_store";

/**
 * Settings de negocio en Redis (editables desde admin, sin tocar código).
 * Cae al objeto estático si no hay override almacenado.
 */
export async function readStoreSettings(): Promise<StoreSettings> {
  if (!isRedisAvailable()) return staticSettings;
  try {
    const stored = await storageGet<Partial<StoreSettings>>(COLLECTION, DOC);
    return { ...staticSettings, ...stored };
  } catch {
    return staticSettings;
  }
}

export async function updateStoreSettings(
  patch: Partial<StoreSettings>
): Promise<StoreSettings> {
  const current = await readStoreSettings();
  const next = { ...current, ...patch };
  await storageSet(COLLECTION, DOC, next);
  return next;
}

export async function resetStoreSettings(): Promise<StoreSettings> {
  await storageSet(COLLECTION, DOC, staticSettings);
  return staticSettings;
}
