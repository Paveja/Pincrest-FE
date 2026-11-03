import Link from "next/link";
import type { ReactNode } from "react";
import type { Pin } from "@/services/content";
import { PinImage } from "@/components/pins/pin-image";

interface PinCardProps {
  pin: Pin;
  action?: ReactNode;
}

export function PinCard({ pin, action }: PinCardProps) {
  const detailHref = `/pins/${encodeURIComponent(pin.id)}`;

  return (
    <article className="border-border bg-surface mb-5 break-inside-avoid overflow-hidden rounded-lg border shadow-sm">
      <div className="bg-surface-muted relative aspect-[4/5] overflow-hidden">
        <Link
          href={detailHref}
          className="absolute inset-0"
          aria-label={`View Pin: ${pin.title}`}
        >
          <PinImage
            src={pin.imageUrl}
            alt={pin.title}
            className="size-full"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          />
        </Link>
        {action ? (
          <div className="absolute top-3 right-3 z-10">{action}</div>
        ) : null}
      </div>
      <div className="px-4 py-3">
        <Link
          href={detailHref}
          className="text-foreground hover:text-accent-hover rounded-sm leading-6 font-semibold"
        >
          {pin.title}
        </Link>
        {pin.description ? (
          <p className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-6">
            {pin.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
