import Link from "next/link";
import { readProducts } from "@/lib/products-db";
import { formatMoney } from "@/lib/money";
import { ensureWelcomePromo, WELCOME_PROMO_CODE } from "@/lib/seed";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "5 gadgets que te ahorran 1h al día · Lumaei",
  description:
    "La lista real que usamos en casa. 5 gadgets útiles con envío desde México y EE.UU. Regalo de bienvenida: 10% de descuento con el código LUMAI10.",
};

export default async function CincoGadgetsPage() {
  // Garantiza que el código de bienvenida exista en el momento en que alguien
  // lo intenta usar en el checkout (idempotente).
  await ensureWelcomePromo();

  const all = await readProducts();
  const picks = all
    .filter((p) => p.active && p.images && p.images.length > 0)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-ivory text-brown">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        {/* Hero */}
        <header className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Lumaei · Lista gratuita
          </p>
          <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            5 gadgets que te ahorran 1h al día
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brown-soft sm:text-base">
            Nada de relleno. Son los 5 que de verdad uso en casa y que, juntos,
            me devuelven más de una hora cada día. Cada uno link a la tienda por
            si quieres verlo en detalle.
          </p>
        </header>

        {/* Banner de descuento (reciprocidad) */}
        <section className="mt-8 rounded-2xl border border-gold/40 bg-cream p-5 text-center sm:p-6">
          <p className="text-sm text-brown-soft">
            Regalo de bienvenida por estar aquí:
          </p>
          <p className="mt-1 font-serif text-2xl font-semibold text-brown">
            10% de descuento en tu primera compra
          </p>
          <p className="mt-2 text-sm text-brown-soft">
            Usa el código{" "}
            <span className="rounded-md bg-brown px-2 py-1 font-mono text-sm font-bold tracking-wider text-ivory">
              {WELCOME_PROMO_CODE}
            </span>{" "}
            al pagar.
          </p>
          <Link
            href="/productos"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-brown px-6 py-3 text-sm font-semibold tracking-wide text-ivory transition hover:bg-gold-dark"
          >
            Ver la tienda
          </Link>
        </section>

        {/* Los 5 gadgets */}
        <section className="mt-10 space-y-6">
          {picks.map((p, i) => (
            <article
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-gold/30 bg-white p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
            >
              <div className="relative shrink-0">
                <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-dark text-xs font-bold text-ivory">
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="h-32 w-full rounded-xl object-cover sm:h-28 sm:w-28"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
                  {p.category}
                </p>
                <h2 className="mt-0.5 font-serif text-lg font-semibold leading-snug">
                  {p.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-brown-soft">
                  {p.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-brown">
                    {formatMoney(p.priceUsd)}
                  </span>
                  {typeof p.rating === "number" && p.rating > 0 && (
                    <span className="text-brown-soft">
                      ★ {p.rating.toFixed(1)}
                      {typeof p.reviews === "number" && p.reviews > 0 && (
                        <span className="ml-1 text-xs">
                          ({p.reviews} reseñas)
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/productos/${p.slug}`}
                className="shrink-0 rounded-full border border-brown/30 px-4 py-2 text-center text-sm font-semibold text-brown transition hover:bg-brown hover:text-ivory sm:self-center"
              >
                Ver gadget
              </Link>
            </article>
          ))}
        </section>

        {/* CTA cierre */}
        <section className="mt-12 rounded-2xl bg-brown p-8 text-center text-ivory">
          <h2 className="font-serif text-2xl font-semibold">
            Empieza con 10% de descuento
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ivory/80">
            Elige el que más te sirva, llévalo al carrito y aplica{" "}
            <span className="font-mono font-bold tracking-wider">
              {WELCOME_PROMO_CODE}
            </span>{" "}
            al pagar. Envío gratis desde 2 piezas.
          </p>
          <Link
            href="/productos"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-ivory px-6 py-3 text-sm font-semibold tracking-wide text-brown transition hover:bg-gold-dark hover:text-ivory"
          >
            Ir a la tienda
          </Link>
        </section>

        <p className="mt-10 text-center text-xs text-brown-soft/70">
          Lumaei · precios en dólares, tu tarjeta convierte al pagar · envío
          desde México y EE.UU.
        </p>
      </div>
    </main>
  );
}
