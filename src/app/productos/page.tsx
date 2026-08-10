import { readProducts } from "@/lib/products-db";
import { toPublicProduct } from "@/lib/types";
import Catalog from "@/components/Catalog";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const all = await readProducts();
  const active = all.filter((p) => p.active);

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Sanitizado: NUNCA enviar costos/SKUs internos al cliente */}
      <Catalog products={active.map(toPublicProduct)} />
    </div>
  );
}
