"use client";

import { useEffect, useState } from "react";
import { settings as fallback } from "./settings";
import type { StoreSettings } from "./types";

let cache: StoreSettings | null = null;

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cache || fallback);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setSettings(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        // merge: la API pública solo expone un subconjunto de campos.
        cache = { ...fallback, ...(d.settings || {}) };
        setSettings(cache!);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
