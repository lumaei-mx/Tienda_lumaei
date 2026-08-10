import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "lumaei_admin";
/** Tokens admin válidos por 7 días (igual que la cookie). */
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET no configurado");
  return s;
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparación en tiempo constante (sin módulo Node: corre en Edge Runtime). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function makeAdminToken() {
  const payload = btoa(JSON.stringify({ v: 1, t: Date.now() }));
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await sign(payload);
  if (!safeEqual(sig, expected)) return false;
  // Expiración: el payload incluye el timestamp de emisión.
  try {
    const parsed = JSON.parse(atob(payload)) as { t?: number };
    if (typeof parsed.t === "number" && Date.now() - parsed.t > TOKEN_MAX_AGE_MS) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

export async function checkPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export function adminCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  // Fail-closed: SIN token válido → login, esté o no configurado el password.
  // Un admin sin credenciales debe quedar inaccesible (nunca expuesto).
  const token = req.cookies.get(COOKIE)?.value;
  if (!(await verifyAdminToken(token))) {
    const url = new URL("/admin/login", req.url);
    return NextResponse.redirect(url);
  }
  return null;
}

/** Para Route Handlers (fetch Request): true si hay cookie admin válida. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const header = req.headers.get("cookie") || "";
  const token = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return verifyAdminToken(token);
}
