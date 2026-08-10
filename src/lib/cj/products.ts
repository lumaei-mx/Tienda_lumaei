import type { Product } from "@/lib/types";
import { readStoreSettings } from "@/lib/settings-db";
import { calculateFreight, pickCheapest } from "./orders";
import { cjRequest } from "./client";
import type { CjFreightOption, CjProductDetail, CjProductListItem, CjVariant } from "./types";

function num(v: unknown, fallback = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export interface CjSearchResult {
  id: string;
  name: string;
  image?: string;
  priceUsd: number;
  stock: number;
  category?: string;
  sku?: string;
}

/** Busca productos reales en el catálogo CJ */
export async function searchCjProducts(opts: {
  keyword: string;
  page?: number;
  size?: number;
  countryCode?: string;
  maxPrice?: number;
}): Promise<{ items: CjSearchResult[]; total: number }> {
  const data = await cjRequest<{
    pageNumber?: number;
    totalRecords?: number;
    content?: Array<{ productList?: CjProductListItem[] }>;
  }>("/product/listV2", {
    method: "GET",
    params: {
      keyWord: opts.keyword,
      page: opts.page ?? 1,
      size: opts.size ?? 20,
      countryCode: opts.countryCode,
      endSellPrice: opts.maxPrice,
      startWarehouseInventory: 1,
      orderBy: 1,
      sort: "desc",
    },
  });

  const list =
    data?.content?.flatMap((c) => c.productList || []) ||
    // fallback shape
    ((data as unknown as { list?: CjProductListItem[] }).list || []);

  const items: CjSearchResult[] = list.map((p) => ({
    id: p.id,
    name: p.nameEn,
    image: p.bigImage,
    priceUsd: num(p.discountPrice ?? p.nowPrice ?? p.sellPrice),
    stock: num(p.warehouseInventoryNum),
    category: p.threeCategoryName || p.oneCategoryName,
    sku: p.sku || p.spu,
  }));

  return { items, total: num(data?.totalRecords, items.length) };
}

/** Detalle + variantes (vid real para órdenes) */
export async function getCjProductDetail(pid: string): Promise<CjProductDetail> {
  // Endpoint product details
  const data = await cjRequest<CjProductDetail>("/product/query", {
    method: "GET",
    params: { pid },
  });
  return data;
}

/**
 * Normaliza peso CJ (valores <= 20 están en kg; el resto en gramos).
 */
function weightGrams(v: number | undefined, fallback = 0): number {
  const w = num(v, 0);
  if (w <= 0) return fallback;
  return w > 20 ? w : w * 1000;
}

/**
 * Elige la variante REAL de un producto CJ.
 *
 * CJ incluye en `variants` accesorios, repuestos y samples (a veces $0.27,
 * $0.63) junto al producto funcional. Elegir "la más barata con stock"
 * produce costos ilusorios y pérdidas al vender. Este selector:
 *  1. Prefiere variantes con stock.
 *  2. Descarta variantes demasiado baratas vs el precio base del producto
 *     (accesorios/repuestos) — umbral max(1.5, sellPrice*0.3).
 *  3. Descarta variantes demasiado livianas vs el peso del producto
 *     (un repuesto de 36g cuando el producto pesa 774g) — umbral
 *     max(30, productWeight*0.3), solo si hay peso base.
 *  4. Elige la más barata entre las válidas.
 */
export function pickVariant(
  variants: CjVariant[] | undefined,
  detail?: Pick<CjProductDetail, "sellPrice" | "productWeight">
): CjVariant | null {
  if (!variants?.length) return null;
  const withStock = variants.filter((v) => num(v.variantStock, 1) > 0);
  const pool = withStock.length ? withStock : variants;

  const basePrice = detail ? num(detail.sellPrice) : 0;
  const baseWeight = detail ? weightGrams(detail.productWeight) : 0;
  const minPrice = Math.max(1.5, basePrice * 0.3);

  // descarta accesorios por precio
  let candidates = pool.filter((v) => {
    const price = num(v.variantSellPrice ?? v.variantPrice, 0);
    return price >= minPrice;
  });
  if (!candidates.length) candidates = pool;

  // descarta repuestos por peso (solo si conocemos el peso base)
  const byWeight = candidates.filter((v) => {
    if (!baseWeight) return true;
    const w = weightGrams(v.variantWeight);
    if (w <= 0) return true; // sin dato de peso → no descartar por peso
    return w >= Math.max(30, baseWeight * 0.3);
  });
  const final = byWeight.length ? byWeight : candidates;

  return [...final].sort(
    (a, b) =>
      num(a.variantSellPrice ?? a.variantPrice) -
      num(b.variantSellPrice ?? b.variantPrice)
  )[0];
}

/**
 * Mapea un producto CJ → Product Lumaei con pricing MX/US.
 * Markup: cost * MARKUP, redondeado. El precio NO incluye envío (se cobra
 * aparte en checkout); shippingMxUsd/shippingUsUsd se guardan para COGS.
 */
export function mapCjToProduct(
  detail: CjProductDetail,
  opts?: { markup?: number; shippingMxUsd?: number; shippingUsUsd?: number }
): Product {
  const markup = opts?.markup ?? Number(process.env.CJ_DEFAULT_MARKUP || 2.6);
  const shippingMxUsd = opts?.shippingMxUsd ?? 9.99;
  const shippingUsUsd = opts?.shippingUsUsd ?? 9.99;

  const variant = pickVariant(detail.variants, detail);
  const costUsd = num(
    variant?.variantSellPrice ??
      variant?.variantPrice ??
      detail.sellPrice,
    5
  );
  const vid = variant?.vid || detail.pid;
  const sku = variant?.variantSku || detail.productSku || detail.pid;
  const name =
    detail.productNameEn || detail.productName || "Producto CJ";
  const images = [
    ...(detail.productImageSet || []),
    detail.productImage,
    variant?.variantImage,
  ].filter(Boolean) as string[];

  const uniqueImages = [...new Set(images)].slice(0, 5);
  if (uniqueImages.length === 0) {
    uniqueImages.push("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800");
  }

  // priceUsd NO incluye envío: el envío se cobra aparte en checkout (calcShipping).
  // El margen real del pedido incluye el envío cobrado al cliente.
  // shippingMxUsd/shippingUsUsd se guardan solo para COGS/margen.
  const priceUsd = Math.max(
    Number((costUsd * markup).toFixed(2)),
    costUsd + 5
  );

  const weight = weightGrams(variant?.variantWeight, weightGrams(detail.productWeight, 200));
  const stock = num(variant?.variantStock, 100);
  const slugBase = slugify(name) || `cj-${detail.pid.slice(0, 8)}`;

  return {
    id: `cj-${detail.pid}`,
    slug: slugBase,
    name,
    description: (
      detail.descriptionEn ||
      detail.description ||
      `${name}. Importado y enviado vía CJ Dropshipping. Verifica tiempos de envío a México y USA al checkout.`
    ).replace(/<[^>]+>/g, " ").slice(0, 1200),
    category: detail.categoryName?.split("/").pop()?.trim() || "General",
    images: uniqueImages,
    priceUsd,
    costUsd,
    shippingMxUsd,
    shippingUsUsd,
    weightGrams: Math.round(weight > 20 ? weight : weight * 1000),
    cjSku: sku,
    cjProductId: detail.pid,
    cjVariantId: vid,
    stock,
    tags: ["cj", "importado"],
    rating: 4.5,
    reviews: 0,
    featured: false,
    active: true,
  };
}

/** Importa pid de CJ y devuelve Product listo para guardar */
export async function importCjProduct(pid: string): Promise<Product> {
  const [detail, settings] = await Promise.all([
    getCjProductDetail(pid),
    readStoreSettings(),
  ]);
  const markup =
    settings?.markup ?? Number(process.env.CJ_DEFAULT_MARKUP || 2.6);

  // some responses nest differently
  const nested = detail as unknown as { product?: CjProductDetail };
  const source: CjProductDetail =
    !detail?.pid && !(detail as unknown as { id?: string }).id && nested.product
      ? { ...nested.product, pid: nested.product.pid || pid }
      : { ...detail, pid: detail.pid || pid };

  const variant = pickVariant(source.variants, source);
  const vid = variant?.vid || source.pid;

  // flete real de CJ por mercado (el envío se cobra aparte en checkout)
  const [mx, us] = await Promise.all([
    calculateFreight({
      endCountryCode: "MX",
      products: [{ vid, quantity: 1 }],
      zip: "01000",
    }).catch(() => [] as CjFreightOption[]),
    calculateFreight({
      endCountryCode: "US",
      products: [{ vid, quantity: 1 }],
      zip: "10001",
    }).catch(() => [] as CjFreightOption[]),
  ]);
  const mxPrice = pickCheapest(mx)?.logisticPrice;
  const usPrice = pickCheapest(us)?.logisticPrice;
  const shippingMxUsd =
    typeof mxPrice === "number" && mxPrice > 0 ? mxPrice : 9.99;
  const shippingUsUsd =
    typeof usPrice === "number" && usPrice > 0 ? usPrice : 9.99;

  return mapCjToProduct(source, { markup, shippingMxUsd, shippingUsUsd });
}
