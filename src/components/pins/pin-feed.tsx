"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SavePinDialog } from "@/components/boards/save-pin-dialog";
import { PinDetailDialog } from "@/components/pins/pin-detail-dialog";
import {
  masonryClassName,
  pinRatioAt,
  PinTile,
} from "@/components/pins/pin-tile";
import { EmptyState } from "@/components/states/empty-state";
import { Notice } from "@/components/states/notice";
import { getPinFeedPage, type FeedPin } from "@/services/feed";
import { getSafeDestinationUrl, likePin, unlikePin } from "@/services/pins";

export function PinFeed() {
  const [pins, setPins] = useState<FeedPin[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [detailPin, setDetailPin] = useState<FeedPin | null>(null);
  const [savePin, setSavePin] = useState<FeedPin | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getPinFeedPage(1, controller.signal)
      .then((result) => {
        setPins(result.pins);
        setPage(result.page);
        setHasNextPage(result.hasNextPage);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "The Pin feed could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [retryToken]);

  async function loadNextPage() {
    if (isLoadingMore || !hasNextPage) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await getPinFeedPage(page + 1);
      setPins((currentPins) => {
        const seenIds = new Set(currentPins.map((pin) => String(pin.id)));
        const newPins = result.pins.filter((pin) => {
          const key = String(pin.id);
          if (seenIds.has(key)) {
            return false;
          }
          seenIds.add(key);
          return true;
        });

        return [...currentPins, ...newPins];
      });
      setPage(result.page);
      setHasNextPage(result.hasNextPage);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "More Pins could not be loaded. Try again.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function retryInitialLoad() {
    setIsLoading(true);
    setError(null);
    setPins([]);
    setPage(1);
    setHasNextPage(false);
    setRetryToken((current) => current + 1);
  }

  return (
    <section className="mx-auto w-full max-w-[120rem] px-3 pt-2 pb-10 sm:px-5">
      <h1 className="sr-only">Discover Pins</h1>

      {notice ? <Notice>{notice}</Notice> : null}

      <section aria-label="Latest Pins" aria-busy={isLoading}>
        {isLoading ? (
          <FeedSkeleton />
        ) : error && pins.length === 0 ? (
          <div className="bg-surface-muted mx-auto mt-6 max-w-xl rounded-3xl px-6 py-12 text-center">
            <h2 className="text-foreground text-xl font-semibold">
              The feed isn’t available
            </h2>
            <p
              role="alert"
              className="text-muted-foreground mt-2 text-sm leading-6"
            >
              {error}
            </p>
            <button
              type="button"
              onClick={retryInitialLoad}
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Try again
            </button>
          </div>
        ) : pins.length === 0 ? (
          <EmptyState
            title="No Pins in the feed yet"
            description="When the community shares something new, you’ll find it here. You can also create a Pin of your own."
            action={
              <Link
                href="/profile/pins"
                className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Create your first Pin
              </Link>
            }
          />
        ) : (
          <>
            <ul className={masonryClassName}>
              {pins.map((pin) => (
                <FeedPinTile
                  key={pin.id}
                  pin={pin}
                  onOpen={() => setDetailPin(pin)}
                  onSave={() => {
                    setNotice(null);
                    setSavePin(pin);
                  }}
                />
              ))}
            </ul>

            {error ? (
              <div className="bg-danger/10 mx-auto mt-4 max-w-xl rounded-3xl px-5 py-4 text-center">
                <p role="alert" className="text-danger text-sm leading-6">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void loadNextPage()}
                  disabled={isLoadingMore}
                  className="text-danger mt-1 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
                >
                  Retry loading more Pins
                </button>
              </div>
            ) : null}

            {hasNextPage ? (
              <div className="flex justify-center py-8">
                <button
                  type="button"
                  onClick={() => void loadNextPage()}
                  disabled={isLoadingMore}
                  className="bg-surface-muted text-foreground hover:bg-border inline-flex min-h-12 min-w-48 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                >
                  {isLoadingMore ? "Loading Pins…" : "Load more Pins"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {detailPin ? (
        <PinDetailDialog
          pin={detailPin}
          onClose={() => setDetailPin(null)}
          onSave={() => {
            setDetailPin(null);
            setSavePin(detailPin);
          }}
        />
      ) : null}
      {savePin ? (
        <SavePinDialog
          pin={savePin}
          onClose={() => setSavePin(null)}
          onSaved={(board) => setNotice(`Saved to ${board.name}.`)}
        />
      ) : null}
    </section>
  );
}

function FeedPinTile({
  pin,
  onOpen,
  onSave,
}: {
  pin: FeedPin;
  onOpen: () => void;
  onSave: () => void;
}) {
  const imageUrl = getSafeDestinationUrl(pin.imageUrl);
  const profileImage = getSafeDestinationUrl(pin.creator.profileImage);

  return (
    <PinTile
      title={pin.title}
      description={pin.description}
      imageUrl={imageUrl}
      onOpen={onOpen}
      onSave={onSave}
    >
      <div className="flex items-center justify-between gap-1 pt-1">
        <Link
          href={`/users/${encodeURIComponent(pin.creator.username)}`}
          className="text-muted-foreground hover:text-foreground -ml-1 flex min-h-11 min-w-0 items-center gap-2 rounded-full pr-2 pl-1 text-xs font-medium transition-colors motion-reduce:transition-none"
          aria-label={`View ${pin.creator.name}’s profile`}
        >
          {profileImage ? (
            <Image
              src={profileImage}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="bg-surface-muted text-foreground grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold"
            >
              {pin.creator.name.trim().charAt(0).toLocaleUpperCase() || "P"}
            </span>
          )}
          <span className="min-w-0 truncate">{pin.creator.name}</span>
        </Link>
        <PinLikeButton pin={pin} />
      </div>
    </PinTile>
  );
}

function PinLikeButton({ pin }: { pin: FeedPin }) {
  const [isLiked, setIsLiked] = useState(pin.isLiked);
  const [likeCount, setLikeCount] = useState(pin.likeCount);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleLike() {
    const nextIsLiked = !isLiked;
    setIsSaving(true);
    setError(null);

    try {
      if (nextIsLiked) {
        await likePin(pin.id);
      } else {
        await unlikePin(pin.id);
      }

      setIsLiked(nextIsLiked);
      setLikeCount((count) => Math.max(0, count + (nextIsLiked ? 1 : -1)));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your reaction could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => void toggleLike()}
        disabled={isSaving}
        aria-pressed={isLiked}
        aria-busy={isSaving}
        aria-label={`${isLiked ? "Unlike" : "Like"} ${pin.title}. ${likeCount} likes.`}
        className="text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className={`size-5 ${isLiked ? "text-accent" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"
          />
        </svg>
        <span className="tabular-nums">{likeCount.toLocaleString()}</span>
      </button>
      {error ? (
        <p
          role="alert"
          className="text-danger fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-sm rounded-full bg-white px-5 py-3 text-center text-sm shadow-lg"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FeedSkeleton() {
  const ratios = Array.from({ length: 18 }, (_, index) => pinRatioAt(index));

  return (
    <div
      role="status"
      aria-label="Loading Pins"
      className={masonryClassName}
    >
      {ratios.map((ratio, index) => (
        <div key={`feed-skeleton-${index}`} className="mb-4 break-inside-avoid">
          <div
            aria-hidden="true"
            className={`bg-surface-muted ${ratio} animate-pulse rounded-2xl motion-reduce:animate-none`}
          />
          <div
            aria-hidden="true"
            className="bg-surface-muted mt-3 h-3 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
          />
        </div>
      ))}
    </div>
  );
}
