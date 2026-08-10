import { readProducts } from "@/lib/products-db";
import { toPublicProduct } from "@/lib/types";
import { HeroSection, ValueCards, HowItWorks, FeaturedSection } from "@/components/HomeSections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const all = await readProducts();
  const featured = all.filter((p) => p.active && p.featured).slice(0, 6);
  const fallback = featured.length
    ? featured
    : all.filter((p) => p.active).slice(0, 6);

  return (
    <div>
      <HeroSection />
      <ValueCards />
      {/* Sanitizado: NUNCA enviar costos/SKUs internos al cliente */}
      <FeaturedSection products={fallback.map(toPublicProduct)} />
      <HowItWorks />
    </div>
  );
}
