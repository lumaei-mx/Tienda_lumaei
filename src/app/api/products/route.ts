import { NextResponse } from "next/server";
import { readProducts } from "@/lib/products-db";

/**
 * Catálogo público. SOLO campos de cara al cliente: nunca costUsd,
 * márgenes, SKUs ni IDs internos de CJ.
 */
export async function GET() {
  const products = await readProducts();
  return NextResponse.json({
    products: products
      .filter((p) => p.active)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        images: p.images,
        priceUsd: p.priceUsd,
        weightGrams: p.weightGrams,
        stock: p.stock,
        rating: p.rating,
        reviews: p.reviews,
        tags: p.tags,
        featured: p.featured,
      })),
  });
}
