// Importa productos REALES y cumplibles desde CJ para la estrategia TikTok.
// Reemplaza los placeholders "no-fulfillable" con productos reales (SKU real).
// Precio: max(costo*markup, piso que reserva fee+comisión influencer+margen).
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const ENV = path.join(ROOT, ".env.local");
const TOKEN_FILE = path.join(ROOT, "data", "cj-token.json");

// ---- leer env mínimo ----
const envRaw = await fs.readFile(ENV, "utf8").catch(() => "");
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const API_KEY = env.CJ_API_KEY;
const BASE = env.CJ_API_BASE || "https://developers.cjdropshipping.com/api2.0/v1";
if (!API_KEY) throw new Error("CJ_API_KEY no encontrado en .env.local");

// pricing
const FEE = 0.036, INFL = 0.15, MARGIN = 0.12, MARKUP = 2.0;
const reserved = FEE + INFL + MARGIN;

let lastCall = 0;
async function throttle() {
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}
let token = null;
async function getToken() {
  if (token) return token;
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf8");
    const j = JSON.parse(raw);
    if (j.accessToken) { token = j.accessToken; return token; }
  } catch {}
  await throttle();
  const res = await fetch(`${BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: API_KEY }),
  });
  const json = await res.json();
  if (!json?.data?.accessToken) throw new Error("CJ auth: " + (json?.message || res.status));
  token = json.data.accessToken;
  await fs.writeFile(TOKEN_FILE, JSON.stringify(json.data, null, 2));
  return token;
}
async function cjGet(endpoint, params) {
  await throttle();
  const url = new URL(`${BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params || {}))
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "CJ-Access-Token": await getToken() } });
  const json = await res.json();
  if (![true, 0, 200].includes(json.result) && !json.success && json.code !== 200 && json.code !== 0)
    throw new Error(`CJ ${endpoint}: ${json.message || json.code}`);
  return json.data;
}

function num(v, fb = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fb;
}
function weightG(v, fb = 0) {
  const w = num(v, 0);
  if (w <= 0) return fb;
  return w > 20 ? w : w * 1000;
}
function slugify(t) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

async function searchPid(keyword) {
  const data = await cjGet("/product/listV2", {
    keyWord: keyword, page: 1, size: 20,
    startWarehouseInventory: 1, orderBy: 1, sort: "desc",
  });
  const list = data?.content?.flatMap((c) => c.productList || []) || data?.list || [];
  for (const p of list) {
    const cost = num(p.discountPrice ?? p.nowPrice ?? p.sellPrice);
    const stock = num(p.warehouseInventoryNum, 0);
    const pid = p.id || p.pid || p.spu;
    if (pid && stock > 30 && cost > 0 && cost <= 12) return { pid, name: p.nameEn || p.name };
  }
  return null;
}

function mapDetail(detail) {
  const variants = detail.variants || [];
  const basePrice = num(detail.sellPrice);
  const baseWeight = weightG(detail.productWeight);
  const withStock = variants.filter((v) => num(v.variantStock, 1) > 0);
  const pool = withStock.length ? withStock : variants;
  const minPrice = Math.max(1.5, basePrice * 0.3);
  let cands = pool.filter((v) => num(v.variantSellPrice ?? v.variantPrice) >= minPrice);
  if (!cands.length) cands = pool;
  if (baseWeight) cands = cands.filter((v) => {
    const w = weightG(v.variantWeight);
    return !w || w >= Math.max(30, baseWeight * 0.3);
  });
  const final = cands.length ? cands : pool;
  final.sort((a, b) => num(a.variantSellPrice ?? a.variantPrice) - num(b.variantSellPrice ?? b.variantPrice));
  const variant = final[0] || null;
  const costUsd = num(variant?.variantSellPrice ?? variant?.variantPrice ?? detail.sellPrice, 5);
  const vid = variant?.vid || detail.pid;
  const sku = variant?.variantSku || detail.productSku || detail.pid;
  const name = detail.productNameEn || detail.productName || "Producto CJ";
  const images = [...(detail.productImageSet || []), detail.productImage, variant?.variantImage]
    .filter(Boolean).slice(0, 5);
  if (!images.length) images.push("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800");
  const floor = costUsd / (1 - reserved);
  const priceUsd = Math.max(Number((costUsd * MARKUP).toFixed(2)), Number(floor.toFixed(2)), costUsd + 5);
  const weight = weightG(variant?.variantWeight, weightG(detail.productWeight, 200));
  const stock = num(variant?.variantStock, 100);
  const slug = slugify(name) || `cj-${detail.pid.slice(0, 8)}`;
  return {
    id: `cj-${detail.pid}`, slug, name,
    description: (detail.descriptionEn || detail.description || `${name}. Importado y enviado vía CJ.`)
      .replace(/<[^>]+>/g, " ").slice(0, 1200),
    category: (detail.categoryName || "").split("/").pop().trim() || "General",
    images, priceUsd, costUsd,
    shippingMxUsd: 9.99, shippingUsUsd: 9.99,
    weightGrams: Math.round(weight > 20 ? weight : weight * 1000),
    cjSku: sku, cjProductId: detail.pid, cjVariantId: vid, stock,
    tags: ["cj", "importado"], rating: 4.5, reviews: 0,
    featured: false, active: true,
  };
}

const KEYWORDS = [
  "360 rotating spice organizer",
  "manual food chopper",
  "rechargeable LED closet light",
  "car vacuum portable 9000pa",
  "magnetic phone holder car",
  "hydrocolloid acne patches",
  "pet hair steamer brush",
  "automatic foam soap dispenser",
  "galaxy star projection lamp",
  "ice roller face",
];

const existing = JSON.parse(await fs.readFile(path.join(ROOT, "data", "products.json"), "utf8"));
// conservar solo los productos reales y cumplibles (quitar placeholders no-fulfillable)
const kept = existing.filter((p) => !p.tags?.includes("no-fulfillable"));
console.log(`Productos existentes reales conservados: ${kept.length}`);

const imported = [];
for (const kw of KEYWORDS) {
  try {
    const found = await searchPid(kw);
    if (!found) { console.log(`  SKIP (sin match) ${kw}`); continue; }
    if (imported.some((p) => p.cjProductId === found.pid) || kept.some((p) => p.cjProductId === found.pid)) {
      console.log(`  DUP ${kw}`); continue;
    }
    const detail = await cjGet("/product/query", { pid: found.pid });
    const prod = mapDetail(detail);
    imported.push(prod);
    console.log(`  OK ${kw} -> ${prod.name.slice(0, 40)} | cost $${prod.costUsd} | price $${prod.priceUsd}`);
  } catch (e) {
    console.log(`  ERR ${kw}: ${e.message}`);
  }
}

const all = [...kept, ...imported];
await fs.writeFile(path.join(ROOT, "data", "products.json"), JSON.stringify(all, null, 2));
console.log(`\nCatálogo final: ${all.length} productos (${imported.length} nuevos reales CJ).`);
