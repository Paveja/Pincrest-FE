"use client";

import { useState } from "react";
import Image from "next/image";

interface PinImageProps {
  src: string;
  alt: string;
  className: string;
  sizes: string;
}

function getSafeImageSource(value: string): string | null {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function PinImage({ src, alt, className, sizes }: PinImageProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const safeSource = getSafeImageSource(src);

  if (!safeSource || hasFailed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — image unavailable`}
        className={`${className} grid place-items-center px-4 text-center`}
      >
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={safeSource}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setHasFailed(true)}
      className={`${className} object-cover`}
    />
  );
}
