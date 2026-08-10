import { readFileSync } from "fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

let _db: Firestore | null = null;

function parseJson(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function credentials(): { projectId: string; clientEmail: string; privateKey: string } | null {
  // FIREBASE_SERVICE_ACCOUNT = JSON string completo de la service account
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    const sa = parseJson(json);
    if (sa?.project_id && sa.client_email && sa.private_key) {
      return {
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key.replace(/\\n/g, "\n"),
      };
    }
  }
  // GOOGLE_APPLICATION_CREDENTIALS = ruta a archivo JSON (local)
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gacPath) {
    try {
      const sa = parseJson(
        readFileSync(gacPath, "utf8")
      );
      if (sa?.project_id && sa.client_email && sa.private_key) {
        return {
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch {
      /* ignora */
    }
  }
  // o vars separadas
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  return null;
}

export function isFirestoreAvailable(): boolean {
  return Boolean(credentials());
}

function getDb(): Firestore {
  if (_db) return _db;
  const cred = credentials();
  if (!cred) throw new Error("Firestore no configurado");
  if (!getApps().length) {
    initializeApp({ credential: cert(cred), projectId: cred.projectId });
  }
  _db = getFirestore();
  return _db;
}

function toJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(toJson);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    // Firestore Timestamp viene como { _seconds, _nanoseconds }
    if ("_seconds" in v && "_nanoseconds" in v) {
      return new Date(Number(v._seconds) * 1000).toISOString();
    }
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = toJson(val);
    return out;
  }
  return value;
}

async function getDocData<T>(collection: string, id: string): Promise<T | null> {
  const snap = await getDb().collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return toJson(snap.data()) as T;
}

async function getAllDocs<T>(collection: string): Promise<T[]> {
  const snap = await getDb().collection(collection).get();
  return snap.docs.map((d) => toJson(d.data()) as T);
}

async function setDocData(collection: string, id: string, data: unknown) {
  await getDb().collection(collection).doc(id).set(data as Record<string, unknown>);
}

export async function storageGet<T>(collection: string, id: string): Promise<T | null> {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  return getDocData<T>(collection, id);
}

export async function storageList<T>(collection: string): Promise<T[]> {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  return getAllDocs<T>(collection);
}

export async function storageSet(collection: string, id: string, data: unknown) {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  await setDocData(collection, id, data);
}

export async function storageDelete(collection: string, id: string) {
  if (!isFirestoreAvailable()) throw new Error("no-firestore");
  await getDb().collection(collection).doc(id).delete();
}
