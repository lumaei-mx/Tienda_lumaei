"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const safe = images.length ? images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];
  const unoptimized = safe[active]?.includes("aliyuncs") || safe[active]?.includes("cjdropshipping");

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-gold/20 bg-cream-dark">
        <Image
          src={safe[active]}
          alt={alt}
          fill
          className="object-cover"
          priority={active === 0}
          sizes="(max-width:768px) 100vw, 50vw"
          unoptimized={unoptimized}
        />
      </div>
      {safe.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {safe.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={src.includes("aliyuncs") || src.includes("cjdropshipping")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
