import { readFileSync, writeFileSync } from "fs";
import { createClient } from "redis";

const env = readFileSync(".env.local", "utf8");
const match = env.match(/REDIS_URL=(.*)/);
const REDIS_URL = match ? match[1].trim().replace(/^"|"$/g, "") : null;
if (!REDIS_URL) { console.error("REDIS_URL no encontrado"); process.exit(1); }

const products = JSON.parse(readFileSync("data/products.json", "utf8"));

const client = createClient({ url: REDIS_URL });
await client.connect();

// 1) respaldar lo que haya en Redis ahora
const existingKeys = await client.keys("products:*");
const backup = [];
for (const k of existingKeys) {
  const raw = await client.get(k);
  if (raw) backup.push(JSON.parse(raw));
}
writeFileSync(
  `scripts/backup-products-${Date.now()}.json`,
  JSON.stringify(backup, null, 2)
);
console.log(`Backup de ${backup.length} productos existentes en Redis guardado.`);

// 2) limpiar productos previos y escribir los reales del catálogo
for (const k of existingKeys) await client.del(k);

let activos = 0;
for (const p of products) {
  await client.set(`products:${p.id}`, JSON.stringify(p));
  if (p.active) activos++;
}
console.log(`Redis ahora tiene ${products.length} productos (${activos} activos).`);

// 3) verificación
const after = await client.keys("products:*");
console.log(`Claves en Redis tras sync: ${after.length}`);
await client.quit();
