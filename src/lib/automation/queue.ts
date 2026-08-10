import {
  storageList,
  storageGet,
  storageSet,
  storageDelete,
  isRedisAvailable,
} from "@/lib/storage";

const COLLECTION = "queues";
const RETRY_PREFIX = "fulfill_retry";

export interface RetryItem {
  orderId: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

function key(orderId: string) {
  return `${RETRY_PREFIX}:${orderId}`;
}

export async function enqueueRetry(
  orderId: string,
  error?: string,
  attempts = 0
): Promise<RetryItem> {
  const now = new Date().toISOString();
  const item: RetryItem = {
    orderId,
    attempts,
    lastError: error,
    createdAt: now,
    updatedAt: now,
  };
  await storageSet(COLLECTION, key(orderId), item);
  return item;
}

export async function getRetryItem(orderId: string): Promise<RetryItem | null> {
  try {
    return await storageGet<RetryItem>(COLLECTION, key(orderId));
  } catch {
    return null;
  }
}

export async function listRetries(): Promise<RetryItem[]> {
  if (!isRedisAvailable()) return [];
  return storageList<RetryItem>(COLLECTION);
}

export async function removeRetry(orderId: string) {
  try {
    await storageDelete(COLLECTION, key(orderId));
  } catch {
    /* ignora */
  }
}
