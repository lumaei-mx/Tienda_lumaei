import { ShieldCheck } from "lucide-react";

/**
 * Sello de confianza Lumaei para las fichas de producto.
 * Metáfora "luz como transformación": glow cálido (oro) que evoca la identidad
 * de la marca (Lum = luz). Comunica garantía + cobertura de envío sin ruido.
 */
export function TrustSeal({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gradient-to-r from-gold/10 via-ivory to-gold/5 px-2.5 py-1 text-[11px] font-medium text-brown-soft shadow-[0_0_12px_rgba(201,169,110,0.25)] ${className}`}
    >
      <ShieldCheck size={13} strokeWidth={1.8} className="text-gold-dark" />
      90 días de garantía · Envío MX y US
    </span>
  );
}
