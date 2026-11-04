"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SavePinDialog } from "@/components/boards/save-pin-dialog";
import { PinDetailDialog } from "@/components/pins/pin-detail-dialog";
import { EmptyState } from "@/components/states/empty-state";
import { getPinFeedPage, type FeedPin } from "@/services/feed";
import { getSafeDestinationUrl, likePin, unlikePin } from "@/services/pins";

const skeletonRatios = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
];

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
    <section className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 sm:py-9 2xl:px-10">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-semibold">
            Discover
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Find your next idea.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6 sm:text-base">
            Browse Pins shared by the Pincrest community and save the ones you
            want to revisit.
          </p>
        </div>
        <Link
          href="/profile/pins?new=1"
          className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-12 shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors motion-reduce:transition-none"
        >
          Create a Pin
        </Link>
      </header>

      {notice ? (
        <p role="status" className="text-accent mt-5 text-sm font-medium">
          {notice}
        </p>
      ) : null}

      <section aria-label="Latest Pins" aria-busy={isLoading} className="pt-7">
        {isLoading ? (
          <FeedSkeleton />
        ) : error && pins.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border px-6 py-10 text-center">
            <h2 className="text-foreground text-lg font-semibold">
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
              className="bg-accent text-accent-foreground hover:bg-accent-hover mt-5 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
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
                href="/profile/pins?new=1"
                className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                Create your first Pin
              </Link>
            }
          />
        ) : (
          <>
            <ul className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5 2xl:columns-6">
              {pins.map((pin) => (
                <PinCard
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
              <div className="border-danger/30 bg-danger/5 mt-7 rounded-lg border px-5 py-4">
                <p role="alert" className="text-danger text-sm leading-6">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void loadNextPage()}
                  disabled={isLoadingMore}
                  className="text-accent hover:text-accent-hover mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
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
                  className="border-border bg-surface text-foreground hover:bg-surface-muted inline-flex min-h-12 min-w-44 items-center justify-center rounded-md border px-6 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
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

function PinCard({
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
  const imageRatios = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square"];
  const imageRatio =
    imageRatios[String(pin.id).charCodeAt(0) % imageRatios.length];

  return (
    <li className="mb-6 break-inside-avoid">
      <article className="group min-w-0">
        <div
          className={`bg-surface-muted relative overflow-hidden rounded-2xl ${imageRatio}`}
        >
          <button
            type="button"
            onClick={onOpen}
            aria-label={`View ${pin.title}`}
            className="focus-visible:outline-accent absolute inset-0 block w-full"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={pin.title}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 18vw"
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none"
              />
            ) : (
              <span className="text-muted-foreground grid h-full place-items-center px-4 text-center text-sm">
                Image unavailable
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-label={`Save ${pin.title} to a Board`}
            className="bg-accent text-accent-foreground hover:bg-accent-hover absolute top-3 right-3 z-10 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-lg transition-colors motion-reduce:transition-none"
          >
            Save
          </button>
        </div>

        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${pin.title}`}
          className="text-foreground block w-full rounded-md pt-2 text-left text-sm leading-5 font-semibold decoration-current/40 underline-offset-4 hover:underline focus-visible:underline"
        >
          {pin.title}
        </button>

        {pin.description ? (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-5">
            {pin.description}
          </p>
        ) : null}

        <div className="mt-2 flex min-w-0 items-center justify-between gap-1">
          <Link
            href={`/users/${encodeURIComponent(pin.creator.username)}`}
            className="text-muted-foreground hover:text-foreground flex min-h-11 min-w-0 items-center gap-2 rounded-full text-left text-xs font-medium transition-colors motion-reduce:transition-none"
            aria-label={`View ${pin.creator.name}’s profile`}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt=""
                width={28}
                height={28}
                unoptimized
                className="size-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="bg-surface-muted text-accent grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold"
              >
                {pin.creator.name.trim().charAt(0).toLocaleUpperCase() || "P"}
              </span>
            )}
            <span className="min-w-0 truncate">{pin.creator.name}</span>
          </Link>
          <PinLikeButton pin={pin} />
        </div>
      </article>
    </li>
  );
}

function PinLikeButton({ pin }: { pin: FeedPin }) {
  const [isLiked, setIsLiked] = useState(pin.isLiked);
  const [likeCount, setLikeCount] = useState(pin.likeCount);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  async function toggleLike() {
    if (isSaving) {
      return;
    }

    const nextIsLiked = !isLiked;
    const previousLikeCount = likeCount;

    setIsSaving(true);
    setError(null);
    setIsLiked(nextIsLiked);
    setLikeCount((count) => Math.max(0, count + (nextIsLiked ? 1 : -1)));
    setAnimationKey((current) => current + 1);

    try {
      if (nextIsLiked) {
        await likePin(pin.id);
      } else {
        await unlikePin(pin.id);
      }
    } catch (cause) {
      setIsLiked(!nextIsLiked);
      setLikeCount(previousLikeCount);
      setAnimationKey((current) => current + 1);
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
    <div className="flex min-w-0 shrink-0 flex-col items-end">
      <button
        type="button"
        onClick={() => void toggleLike()}
        disabled={isSaving}
        aria-pressed={isLiked}
        aria-busy={isSaving}
        aria-label={`${isLiked ? "Unlike" : "Like"} ${pin.title}. ${likeCount} likes.`}
        className="text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          key={`${animationKey}-${isLiked}`}
          className={`text-accent size-4 ${isLiked && animationKey > 0 ? "pin-like-pop" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"
          />
        </svg>
        <span className="hidden sm:inline">
          {isSaving ? "Saving…" : isLiked ? "Unlike" : "Like"}
        </span>
        <span
          key={animationKey}
          className={`text-muted-foreground tabular-nums ${animationKey > 0 ? "pin-like-count-value" : ""}`}
        >
          {likeCount.toLocaleString()}
        </span>
      </button>
      {error ? (
        <p
          role="alert"
          className="text-danger mt-1 max-w-40 text-right text-xs leading-4"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading Pins"
      className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5 2xl:columns-6"
    >
      {skeletonRatios.map((ratio, index) => (
        <div
          key={`feed-skeleton-${index}`}
          className="border-border bg-surface mb-5 break-inside-avoid overflow-hidden rounded-lg border"
        >
          <div
            aria-hidden="true"
            className={`bg-surface-muted ${ratio} animate-pulse motion-reduce:animate-none`}
          />
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <span
              aria-hidden="true"
              className="bg-surface-muted size-8 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
            />
            <span
              aria-hidden="true"
              className="bg-surface-muted h-3 w-2/3 animate-pulse rounded motion-reduce:animate-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
