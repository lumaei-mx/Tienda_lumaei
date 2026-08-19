"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Mail, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import Link from "next/link";

const SHOWN_KEY = "lumaei_email_capture_shown";
const DONE_KEY = "lumaei_email_capture_done";
const MOBILE_DELAY_MS = 25_000;
const BLOCKED_PREFIXES = ["/checkout", "/carrito", "/admin", "/pedido"];

type Status = "idle" | "loading" | "done" | "error" | "ratelimit";

/**
 * Email capture P0: popup exit-intent con lead magnet.
 * - Desktop: mouseout del viewport (e.clientY <= 0).
 * - Mobile: 25s con al menos un scroll.
 * - UNA vez por sesión (flag en localStorage) · nunca en checkout/carrito/admin.
 * - No bloqueante: fondo semitransparente, cierre por X / Escape / backdrop.
 */
export function EmailCapturePopup() {
  const pathname = usePathname();
  const lang = useCart((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const shownRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pathname) return;
    if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    if (typeof window === "undefined") return;
    try {
      // Ya capturamos este email en una sesión anterior → nunca volver a pedir.
      if (window.localStorage.getItem(DONE_KEY)) return;
      if (window.localStorage.getItem(SHOWN_KEY)) return;
    } catch {
      return;
    }

    const show = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      try {
        window.localStorage.setItem(SHOWN_KEY, "1");
      } catch {
        /* sin localStorage: muestra igual esta sesión */
      }
      setOpen(true);
    };

    const mobile =
      window.matchMedia?.("(pointer: coarse)").matches ||
      (window.matchMedia?.("(max-width: 768px)").matches ?? false);

    if (mobile) {
      let hasScrolled = false;
      const onScroll = () => {
        hasScrolled = true;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      const timer = setTimeout(() => {
        if (hasScrolled) show();
      }, MOBILE_DELAY_MS);
      return () => {
        window.removeEventListener("scroll", onScroll);
        clearTimeout(timer);
      };
    }

    const onMouseOut = (e: MouseEvent) => {
      // Salida real del viewport (no hacia otro elemento de la página).
      if (e.clientY <= 0 && e.relatedTarget === null) show();
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [pathname]);

  // Escape cierra · foco al input cuando abre.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusId);
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "exit_intent" }),
      });
      if (res.status === 429) {
        setStatus("ratelimit");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
      try {
        window.localStorage.setItem(DONE_KEY, "1");
      } catch {
        /* no-op */
      }
      // Confirmación breve y cierre suave.
      window.setTimeout(() => setOpen(false), 2800);
    } catch {
      setStatus("error");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brown/60 p-4 backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-capture-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-gold-light bg-ivory p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brown-soft transition hover:bg-cream hover:text-brown"
        >
          <X size={18} />
        </button>

        {status === "done" ? (
          <div className="py-8 text-center">
            <CheckCircle2
              size={44}
              className="mx-auto mb-4 text-gold-dark"
              strokeWidth={1.5}
            />
            <p className="font-serif text-2xl font-semibold text-brown">
              {t("leadConfirm", lang)}
            </p>
            <p className="mt-2 text-sm text-brown-soft">
              {lang === "es"
                ? "Y tu 10% de descuento (LUMAI10) lo tienes aquí:"
                : "Your 10% off (LUMAI10) is right here:"}
            </p>
            <Link
              href="/guia/5-gadgets"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-ivory transition hover:bg-gold-dark"
            >
              {lang === "es" ? "Ver mi lista + 10%" : "See my list + 10%"}
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Lumaei
            </p>
            <h2
              id="email-capture-title"
              className="font-serif text-3xl font-semibold leading-tight text-brown"
            >
              {t("leadHeadline", lang)}
            </h2>
            <p className="mt-2 text-sm text-brown-soft">{t("leadSub", lang)}</p>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3" noValidate>
              <label htmlFor="email-capture-input" className="sr-only">
                {t("formEmail", lang)}
              </label>
              <input
                ref={inputRef}
                id="email-capture-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("leadEmailPlaceholder", lang)}
                className="w-full rounded-full border border-gold/40 bg-cream px-5 py-3.5 text-sm text-brown outline-none ring-gold placeholder:text-brown-soft/60 focus:ring-2"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brown px-6 py-3.5 text-sm font-semibold tracking-wide text-ivory transition hover:bg-gold-dark disabled:opacity-60"
              >
                <Mail size={16} strokeWidth={1.75} />
                {status === "loading" ? "…" : t("leadCta", lang)}
              </button>
              {status === "error" && (
                <p className="text-center text-xs font-medium text-red-700">
                  {t("leadError", lang)}
                </p>
              )}
              {status === "ratelimit" && (
                <p className="text-center text-xs font-medium text-brown-soft">
                  {t("leadRateLimit", lang)}
                </p>
              )}
            </form>

            <p className="mt-4 text-center text-[11px] text-brown-soft/70">
              {t("leadPrivacy", lang)}{" "}
              <Link href="/privacidad" className="underline hover:text-brown">
                {lang === "es" ? "Aviso de Privacidad" : "Privacy Notice"}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
