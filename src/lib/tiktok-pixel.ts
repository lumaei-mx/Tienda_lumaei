"use client";

import { useEffect } from "react";
import { sha256 } from "js-sha256";

declare global {
  interface Window {
    ttq: {
      identify: (data: IdentifyData) => void;
      track: (event: string, data: EventData) => void;
      page: () => void;
      load?: (id: string) => void;
      instance?: () => Window["ttq"];
      setAndDefer?: (t: unknown, e: string) => void;
      _i?: Record<string, unknown>;
      _t?: Record<string, unknown>;
      _o?: Record<string, unknown>;
    };
  }
}

interface IdentifyData {
  email?: string;
  phone_number?: string;
  external_id?: string;
}

interface ViewContentData {
  contents: Array<{
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
    content_category: string;
    num_items: number;
  }>;
  value: number;
  currency: "USD";
  search_string?: string;
  description?: string;
  status?: string;
}

interface SearchData {
  contents: Array<{
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
  }>;
  value: number;
  currency: "USD";
  search_string: string;
}

interface ContactData {
  contents: Array<{
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
  }>;
  value: number;
  currency: "USD";
}

interface ClickButtonData {
  contents: Array<{
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
  }>;
  value: number;
  currency: "USD";
}

interface LeadData {
  contents: Array<{
    content_id: string;
    content_type: "product" | "product_group";
    content_name: string;
  }>;
  value: number;
  currency: "USD";
}

type EventData =
  | ViewContentData
  | SearchData
  | ContactData
  | ClickButtonData
  | LeadData;

function hash(val: string): string {
  return sha256(val);
}

/** Identifica usuario (PII hasheado) — llamar en checkout/account */
export function identifyUser(data: {
  email?: string;
  phone?: string;
  externalId?: string;
}) {
  if (typeof window === "undefined") return;
  const identifyData: IdentifyData = {};
  if (data.email) identifyData.email = hash(data.email.toLowerCase().trim());
  if (data.phone) identifyData.phone_number = hash(data.phone.replace(/\D/g, ""));
  if (data.externalId) identifyData.external_id = hash(data.externalId);
  if (Object.keys(identifyData).length) {
    window.ttq?.identify(identifyData);
  }
}

/** ViewContent — página de producto */
export function trackViewContent(product: {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  quantity?: number;
}) {
  if (typeof window === "undefined") return;
  window.ttq?.track("ViewContent", {
    contents: [
      {
        content_id: product.id,
        content_type: "product",
        content_name: product.name,
        content_category: product.category,
        num_items: product.quantity ?? 1,
      },
    ],
    value: product.priceUsd,
    currency: "USD",
  });
}

/** Search — resultados de búsqueda */
export function trackSearch(query: string, products: Array<{ id: string; name: string }>) {
  if (typeof window === "undefined") return;
  window.ttq?.track("Search", {
    contents: products.map((p) => ({
      content_id: p.id,
      content_type: "product",
      content_name: p.name,
    })),
    value: products.length,
    currency: "USD",
    search_string: query,
  });
}

/** Contact — formulario de contacto */
export function trackContact(productId?: string, productName?: string, value = 0) {
  if (typeof window === "undefined") return;
  window.ttq?.track("Contact", {
    contents: productId
      ? [
          {
            content_id: productId,
            content_type: "product",
            content_name: productName || "Contact",
          },
        ]
      : [],
    value,
    currency: "USD",
  });
}

/** ClickButton — clicks en botones clave (ej. Add to Cart) */
export function trackClickButton(product: {
  id: string;
  name: string;
  priceUsd: number;
}) {
  if (typeof window === "undefined") return;
  window.ttq?.track("ClickButton", {
    contents: [
      {
        content_id: product.id,
        content_type: "product",
        content_name: product.name,
      },
    ],
    value: product.priceUsd,
    currency: "USD",
  });
}

/** Lead — formulario de lead/newsletter */
export function trackLead(value = 0, productId?: string, productName?: string) {
  if (typeof window === "undefined") return;
  window.ttq?.track("Lead", {
    contents: productId
      ? [
          {
            content_id: productId,
            content_type: "product",
            content_name: productName || "Lead",
          },
        ]
      : [],
    value,
    currency: "USD",
  });
}

/** AddToCart — agregar al carrito */
export function trackAddToCart(product: {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  quantity: number;
}) {
  if (typeof window === "undefined") return;
  window.ttq?.track("AddToCart", {
    contents: [
      {
        content_id: product.id,
        content_type: "product",
        content_name: product.name,
        content_category: product.category,
        num_items: product.quantity,
      },
    ],
    value: product.priceUsd * product.quantity,
    currency: "USD",
  });
}

/** InitiateCheckout — iniciar checkout */
export function trackInitiateCheckout(items: Array<{
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  quantity: number;
}>, totalValue: number) {
  if (typeof window === "undefined") return;
  window.ttq?.track("InitiateCheckout", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      content_category: item.category,
      num_items: item.quantity,
    })),
    value: totalValue,
    currency: "USD",
  });
}

/** CompletePayment / PlaceAnOrder — compra completada */
export function trackCompletePayment(items: Array<{
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  quantity: number;
}>, totalValue: number, orderId: string) {
  if (typeof window === "undefined") return;
  window.ttq?.track("CompletePayment", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      content_category: item.category,
      num_items: item.quantity,
    })),
    value: totalValue,
    currency: "USD",
    // TikTok usa "status" para estado del pedido
    status: "submitted",
  });
  // También PlaceAnOrder como alias común
  window.ttq?.track("PlaceAnOrder", {
    contents: items.map((item) => ({
      content_id: item.id,
      content_type: "product",
      content_name: item.name,
      content_category: item.category,
      num_items: item.quantity,
    })),
    value: totalValue,
    currency: "USD",
  });
}

/** Hook para trackear ViewContent en página de producto */
export function useProductView(product: {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
}) {
  useEffect(() => {
    trackViewContent(product);
  }, [product.id]);
}

/** Hook para trackear AddToCart */
export function useAddToCartTrack() {
  return (product: {
    id: string;
    name: string;
    category: string;
    priceUsd: number;
    quantity: number;
  }) => {
    trackAddToCart(product);
  };
}