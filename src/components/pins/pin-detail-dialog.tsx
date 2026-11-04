"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PinCreator } from "@/services/feed";
import { getSafeDestinationUrl, type Pin } from "@/services/pins";

export type PinDetail = Pick<Pin, "id" | "title" | "imageUrl"> &
  Partial<Pick<Pin, "description" | "destinationUrl">> & {
    creator?: PinCreator;
  };

interface PinDetailDialogProps {
  pin: PinDetail;
  onClose: () => void;
  onSave: () => void;
}

export function PinDetailDialog({
  pin,
  onClose,
  onSave,
}: PinDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const destinationUrl = getSafeDestinationUrl(pin.destinationUrl);
  const imageUrl = getSafeDestinationUrl(pin.imageUrl);
  const creatorImageUrl = getSafeDestinationUrl(pin.creator?.profileImage);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="pin-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="bg-surface text-foreground border-border backdrop:bg-foreground/40 m-auto max-h-[min(92dvh,54rem)] w-[min(100%-2rem,52rem)] overflow-y-auto rounded-xl border p-0 shadow-2xl"
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.85fr)]">
        <div className="bg-surface-muted relative aspect-[4/5] min-h-64 md:aspect-auto">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={pin.title}
              fill
              sizes="(max-width: 768px) 90vw, 480px"
              unoptimized
              className="object-contain"
            />
          ) : (
            <span className="text-muted-foreground grid h-full place-items-center px-4 text-center text-sm">
              Image unavailable
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
                Pin details
              </p>
              <h2
                id="pin-detail-title"
                className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                {pin.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border-border text-muted-foreground hover:bg-surface-muted inline-flex min-h-11 shrink-0 items-center rounded-md border px-4 text-sm font-medium transition-colors motion-reduce:transition-none"
            >
              Close
            </button>
          </div>

          {pin.description ? (
            <p className="text-muted-foreground mt-5 leading-7 whitespace-pre-wrap">
              {pin.description}
            </p>
          ) : (
            <p className="text-muted-foreground mt-5 text-sm leading-6">
              No description was added for this Pin.
            </p>
          )}

          {pin.creator ? (
            <div className="border-border mt-6 flex items-center gap-3 border-t pt-5">
              {creatorImageUrl ? (
                <Image
                  src={creatorImageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="border-border size-10 shrink-0 rounded-full border object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="bg-surface-muted text-accent border-border grid size-10 shrink-0 place-items-center rounded-full border text-sm font-semibold"
                >
                  {pin.creator.name.trim().charAt(0).toLocaleUpperCase() || "P"}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Shared by</p>
                <Link
                  href={`/users/${encodeURIComponent(pin.creator.username)}`}
                  className="text-foreground hover:text-accent-hover mt-0.5 block min-h-6 truncate text-sm font-semibold"
                >
                  {pin.creator.name}
                </Link>
                <p className="text-muted-foreground truncate text-xs">
                  @{pin.creator.username}
                </p>
              </div>
            </div>
          ) : null}

          {destinationUrl ? (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-hover mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-current/40 underline-offset-2"
            >
              Visit destination
            </a>
          ) : null}

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={onSave}
              className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Save Pin
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
