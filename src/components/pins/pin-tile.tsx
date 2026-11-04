"use client";

import Image from "next/image";
import type { ReactNode } from "react";

/** Shared masonry column layout for every Pin gallery. */
export const masonryClassName =
  "columns-2 gap-3 sm:columns-3 sm:gap-4 md:columns-4 lg:columns-5 xl:columns-6";

const PIN_RATIOS = [
  "aspect-[4/5]",
  "aspect-[2/3]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[3/5]",
  "aspect-[4/5]",
];

/** Gives fixed-ratio galleries a varied, staggered rhythm. */
export function pinRatioAt(index: number): string {
  return PIN_RATIOS[index % PIN_RATIOS.length];
}

interface PinTileProps {
  title: string;
  imageUrl: string | null;
  /** Fixed aspect ratio class; omit to let the image set its own height. */
  ratio?: string;
  description?: string | null;
  onOpen?: () => void;
  onSave?: () => void;
  children?: ReactNode;
}

export function PinTile({
  title,
  imageUrl,
  ratio,
  description,
  onOpen,
  onSave,
  children,
}: PinTileProps) {
  const media = imageUrl ? (
    ratio ? (
      <span className={`relative block ${ratio}`}>
        <Image
          src={imageUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
          className="object-cover"
        />
      </span>
    ) : (
      <Image
        src={imageUrl}
        alt=""
        width={800}
        height={600}
        unoptimized
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
        className="block h-auto w-full"
      />
    )
  ) : (
    <span
      className={`text-muted-foreground grid place-items-center px-4 text-center text-sm ${ratio ?? "aspect-[4/5]"}`}
    >
      Image unavailable
    </span>
  );

  return (
    <li className="mb-4 break-inside-avoid">
      <article className="group">
        <div className="bg-surface-muted relative overflow-hidden rounded-2xl">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`View ${title}`}
              className="block w-full text-left"
            >
              {media}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25 group-focus-within:bg-black/25 motion-reduce:transition-none"
              />
            </button>
          ) : (
            media
          )}
          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              aria-label={`Save ${title} to a Board`}
              className="bg-accent text-accent-foreground hover:bg-accent-hover absolute top-2.5 right-2.5 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition-opacity motion-reduce:transition-none md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
            >
              Save
            </button>
          ) : null}
        </div>
        <div className="px-1 pt-2">
          <h3 className="text-foreground line-clamp-2 text-sm leading-5 font-semibold">
            {title}
          </h3>
          {description ? (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-5">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </article>
    </li>
  );
}
