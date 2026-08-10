"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Languages, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";

export function Header() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const lang = useCart((s) => s.lang);
  const setLang = useCart((s) => s.setLang);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú mobile al navegar.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-ivory/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-lumaei-sm.png"
            alt="Lumaei"
            width={160}
            height={116}
            className="h-12 w-auto object-contain sm:h-14"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium tracking-wide text-brown-soft sm:flex">
          <Link href="/productos" className="transition hover:text-gold-dark">
            {t("navCollection", lang)}
          </Link>
          <Link href="/envios" className="transition hover:text-gold-dark">
            {t("navShipping", lang)}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center rounded-full border border-gold/40 bg-cream p-0.5 text-xs font-semibold tracking-wider"
            title="Idioma / Language"
          >
            <Languages
              size={13}
              className="mx-1.5 text-brown-soft"
              strokeWidth={1.5}
            />
            <button
              type="button"
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
              aria-label="Español"
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "es"
                  ? "bg-brown text-ivory"
                  : "text-brown-soft hover:text-brown"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              aria-label="English"
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "en"
                  ? "bg-brown text-ivory"
                  : "text-brown-soft hover:text-brown"
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href="/carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-brown transition hover:border-gold hover:bg-cream-dark"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-brown">
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-brown transition hover:border-gold hover:bg-cream-dark sm:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gold/15 bg-ivory px-4 py-3 sm:hidden">
          <Link
            href="/productos"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brown-soft hover:bg-cream"
          >
            {t("navCollection", lang)}
          </Link>
          <Link
            href="/envios"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brown-soft hover:bg-cream"
          >
            {t("navShipping", lang)}
          </Link>
        </nav>
      )}
    </header>
  );
}
