"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { t } from "@/lib/i18n";
import { STORE_IDENTITY } from "@/lib/identity";

export default function PrivacidadPage() {
  const lang = useCart((s) => s.lang);
  const es = lang === "es";
  const id = STORE_IDENTITY;
  const name = `${id.responsibleName}, ${es ? id.entityTypeEs : id.entityTypeEn}`;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
        {es ? "Privacidad" : "Privacy"}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brown">
        {es ? "Aviso de Privacidad" : "Privacy Notice"}
      </h1>

      <div className="mt-8 space-y-5 leading-relaxed text-brown-soft">
        <p>
          {es
            ? "Este Aviso de Privacidad rige el tratamiento de los datos personales recabados a través de lumaei.com, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)."
            : "This Privacy Notice governs the processing of personal data collected through lumaei.com, in accordance with the Federal Law on the Protection of Personal Data Held by Private Parties (LFPDPPP)."}
        </p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {es ? "Responsable de los datos" : "Data controller"}
        </h2>
        <p>
          {es
            ? `${name} · RFC ${id.rfc} · ${id.onlineNoteEs}. Domicilio fiscal: ${id.domicilePublic} (domicilio fiscal completo según registro ante el SAT).`
            : `${name} · RFC ${id.rfc} · ${id.onlineNoteEn}. Fiscal domicile: ${id.domicilePublic} (full fiscal domicile per SAT registration).`}
        </p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {es ? "Finalidades" : "Purposes"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{es ? "Procesar y entregar tu pedido (pago, envío, seguimiento)." : "Process and fulfill your order (payment, shipping, tracking)."}</li>
          <li>{es ? "Proveer soporte antes, durante y después de la compra." : "Provide support before, during and after purchase."}</li>
          <li>{es ? "Envío de comunicaciones de marketing, solo con tu consentimiento." : "Marketing communications, only with your consent."}</li>
          <li>{es ? "Cumplir obligaciones legales y fiscales." : "Comply with legal and tax obligations."}</li>
        </ul>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {es ? "Datos personales que recabamos" : "Personal data we collect"}
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{es ? "Identificación y contacto: nombre, correo, teléfono, dirección de envío." : "Identification and contact: name, email, phone, shipping address."}</li>
          <li>{es ? "Pago: se procesa directamente con Stripe (PCI-DSS); no almacenamos datos de tarjeta." : "Payment: processed directly with Stripe (PCI-DSS); we do not store card data."}</li>
          <li>{es ? "Navegación: cookies y datos de tráfico (con tu consentimiento)." : "Browsing: cookies and traffic data (with your consent)."}</li>
        </ul>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {es ? "Transferencias" : "Transfers"}
        </h2>
        <p>
          {es
            ? "Compartimos datos únicamente con proveedores necesarios para cumplir el pedido: Stripe (cobro), los proveedores de envío (CJ, Zendrop, Spocket) y plataformas de publicidad (TikTok, Meta) para medición, bajo tu consentimiento. No vendemos tus datos."
            : "We share data only with providers necessary to fulfill the order: Stripe (billing), shipping providers (CJ, Zendrop, Spocket) and advertising platforms (TikTok, Meta) for measurement, under your consent. We do not sell your data."}
        </p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {es ? "Derechos ARCO" : "ARCO rights"}
        </h2>
        <p>
          {es
            ? "Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo a lumaeiMX@gmail.com o vía WhatsApp. Respondemos en menos de 24 horas hábiles."
            : "You may access, rectify, cancel or oppose the processing of your data by writing to lumaeiMX@gmail.com or via WhatsApp. We reply within 24 business hours."}
        </p>

        <h2 className="font-serif text-2xl font-semibold text-brown">
          {es ? "Modificaciones" : "Changes"}
        </h2>
        <p>
          {es
            ? "Este aviso puede actualizarse; la versión vigente estará siempre en esta página."
            : "This notice may be updated; the current version is always published on this page."}
        </p>

        <p className="text-sm">
          <a href="/terminos" className="text-gold-dark underline">{es ? "Términos de compra" : "Purchase terms"}</a>
          {" · "}
          <a href="/devoluciones" className="text-gold-dark underline">{es ? "Devoluciones y garantía" : "Returns & guarantee"}</a>
        </p>
      </div>

      <Link
        href="/productos"
        className="mt-10 inline-block rounded-full bg-brown px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-gold-dark"
      >
        {t("keepShopping", lang)}
      </Link>
    </div>
  );
}
