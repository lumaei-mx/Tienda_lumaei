import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlugAsync } from "@/lib/products-db";
import { toPublicProduct } from "@/lib/types";
import { ProductPageView } from "@/components/ProductPageView";
import { ProductViewTracker } from "@/components/ProductViewTracker";
import { detectLangServer } from "@/lib/i18n";
import { productName } from "@/lib/copy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);
  if (!product) return {};
  const lang = await detectLangServer();
  const name = productName(product, lang);
  const image = product.images?.[0] || "/og-image.png";
  return {
    title: `${name} · $${product.priceUsd.toFixed(2)} USD | Lumaei`,
    description: (product.description || name).replace(/<[^>]+>/g, " ").slice(0, 160),
    openGraph: {
      title: `${name} | Lumaei`,
      description: (product.description || name).replace(/<[^>]+>/g, " ").slice(0, 160),
      url: `https://www.lumaei.com/productos/${slug}`,
      siteName: "Lumaei",
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Lumaei`,
      description: (product.description || name).replace(/<[^>]+>/g, " ").slice(0, 160),
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlugAsync(slug);
  if (!product) notFound();

  return (
    <>
      <ProductViewTracker
        id={product.id}
        name={product.name}
        category={product.category}
        priceUsd={product.priceUsd}
      />
      {/* Sanitizado: NUNCA enviar costos/SKUs internos al cliente */}
      <ProductPageView product={toPublicProduct(product)} />
    </>
  );
}
