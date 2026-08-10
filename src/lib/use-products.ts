"use client";

import { useEffect, useState } from "react";
import type { PublicProduct } from "./types";

let cache: PublicProduct[] | null = null;

export function useProducts() {
  const [products, setProducts] = useState<PublicProduct[]>(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setProducts(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        cache = d.products || [];
        setProducts(cache!);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = (id: string) => products.find((p) => p.id === id);

  return { products, loading, byId };
}

export function invalidateProductsCache() {
  cache = null;
}
