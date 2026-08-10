"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/tiktok-pixel";

interface ProductViewTrackerProps {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
}

export function ProductViewTracker({
  id,
  name,
  category,
  priceUsd,
}: ProductViewTrackerProps) {
  useEffect(() => {
    trackViewContent({ id, name, category, priceUsd });
  }, [id, name, category, priceUsd]);

  return null;
}