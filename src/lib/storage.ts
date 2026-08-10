import { readFileSync } from "fs";
import { createClient, type RedisClientType } from "redis";

/**
 * Capa de almacenamiento para producción (Vercel serverless):
 * 1. Redis (`REDIS_URL`) — preferido, persistente
 * 2. Firestore (`FIREBASE_SERVICE_ACCOUNT` / `GOOGLE_APPLICATION_CREDENTIALS`)
 * 3. Filesystem (dev local)
 */

const REDIS_URL = process.env.REDIS_URL;

export function isRedisAvailable(): boolean {
  return Boolean(REDIS_URL);
}

export function isFirestoreAvailable(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY)
  );
}

// ==== Redis (cliente TCP con singleton global) ====

let _redis: RedisClientType | null = null;
let _redisPromise: Promise<RedisClientType> | null = null;

function getRedis(): Promise<RedisClientType> {
  if (_redis) return Promise.resolve(_redis);
  if (_redisPromise) return _redisPromise;

  _redisPromise = (async () => {
    const client = createClient({ url: REDIS_URL });
    client.on("error", () => {
      /* errores en background no tumban el proceso */
    });
    try {
      await client.connect();
    } catch (err) {
      // Limpia la promesa cacheada: el próximo llamado reintenta la conexión
      // en vez de quedar rechazada para siempre.
      _redisPromise = null;
      try {
        await client.quit();
      } catch {
        /* ya desconectado */
      }
      throw err;
    }
    _redis = client as RedisClientType;
    return _redis;
  })();

  return _redisPromise;
}

function collectionKey(collection: string, id: string) {
  return `${collection}:${id}`;
}

// ==== API pública unificada ====

export async function storageGet<T>(
  collection: string,
  id: string
): Promise<T | null> {
  if (isRedisAvailable()) {
    const raw = await (await getRedis()).get(collectionKey(collection, id));
    return raw ? (JSON.parse(raw) as T) : null;
  }
  if (isFirestoreAvailable()) {
    const { storageGet: fsGet } = await import("./firestore");
    return fsGet<T>(collection, id);
  }
  throw new Error("Sin backend de almacenamiento configurado");
}

export async function storageList<T>(collection: string): Promise<T[]> {
  if (isRedisAvailable()) {
    const client = await getRedis();
    const keys = await client.keys(`${collection}:*`);
    if (!keys.length) return [];
    const out: T[] = [];
    for (const k of keys) {
      const raw = await client.get(k);
      if (raw) out.push(JSON.parse(raw) as T);
    }
    return out;
  }
  if (isFirestoreAvailable()) {
    const { storageList: fsList } = await import("./firestore");
    return fsList<T>(collection);
  }
  throw new Error("Sin backend de almacenamiento configurado");
}

export async function storageSet(collection: string, id: string, data: unknown) {
  if (isRedisAvailable()) {
    await (await getRedis()).set(collectionKey(collection, id), JSON.stringify(data));
    return;
  }
  if (isFirestoreAvailable()) {
    const { storageSet: fsSet } = await import("./firestore");
    return fsSet(collection, id, data);
  }
  throw new Error("Sin backend de almacenamiento configurado");
}

export async function storageDelete(collection: string, id: string) {
  if (isRedisAvailable()) {
    await (await getRedis()).del(collectionKey(collection, id));
    return;
  }
  if (isFirestoreAvailable()) {
    const { storageDelete: fsDel } = await import("./firestore");
    return fsDel(collection, id);
  }
  throw new Error("Sin backend de almacenamiento configurado");
}
