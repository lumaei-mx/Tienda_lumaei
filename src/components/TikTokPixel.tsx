"use client";

import { useEffect } from "react";

const TIKTOK_PIXEL_ID = "D9KQDNRC77U2B4F9MO8G";

/* eslint-disable @typescript-eslint/no-explicit-any */
function loadTikTok(w: any, d: any, t: any) {
  w.TiktokAnalyticsObject = t;
  const ttq = (w[t] = w[t] || []);
  ttq.methods = [
    "page", "track", "identify", "instances", "debug", "on", "off",
    "once", "ready", "alias", "group", "enableCookie", "disableCookie",
    "holdConsent", "revokeConsent", "grantConsent",
  ];
  ttq.setAndDefer = function (t: any, e: any) {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.instance = function (t: any) {
    for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
      ttq.setAndDefer(e, ttq.methods[n]);
    return e;
  };
  ttq.load = function (e: any, n: any) {
    const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    n = document.createElement("script");
    n.type = "text/javascript";
    n.async = true;
    n.src = r + "?sdkid=" + e + "&lib=" + t;
    const first = document.getElementsByTagName("script")[0];
    first.parentNode?.insertBefore(n, first);
  };
  ttq.load(TIKTOK_PIXEL_ID);
  ttq.page();
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Carga el TikTok Pixel en el CLIENTE, después de la hidratación de React.
 *
 * Por qué: el loader inline anterior (next/script afterInteractive) insertaba
 * <script> en el <head> durante la hidratación → React 19 fallaba con #418
 * ("Hydration failed ... didn't match the client"). Al ejecutar el mismo
 * loader en useEffect (post-hidratación), el head del cliente coincide con
 * el del server y el error desaparece.
 */
export function TikTokPixel() {
  useEffect(() => {
    const w = window as any;
    // evita recargar en navegación client (SPA)
    if (w.ttq) return;
    loadTikTok(w, document, "ttq");
  }, []);

  return null;
}
