"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { PinCard } from "@/components/pins/pin-card";
import { PinImage } from "@/components/pins/pin-image";
import { SavePinButton } from "@/components/pins/save-pin-button";
import { getMyPins, getPin } from "@/services/pins";
import type { Pin } from "@/services/content";

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Your Pins could not be loaded. Check your connection and try again.";
}

function getSafeDestinationUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function PinCollectionPage() {
  const [pins, setPins] = useState<Pin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getMyPins(controller.signal)
      .then((result) => {
        setPins(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load the member's Pins.", cause);
          setError(getErrorMessage(cause));
        }
      });

    return () => controller.abort();
  }, [retryCount]);

  if (error) {
    return (
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <ErrorState
          title="Your Pins could not be loaded"
          description={error}
          onRetry={() => {
            setPins(null);
            setError(null);
            setRetryCount((current) => current + 1);
          }}
        />
      </section>
    );
  }

  if (!pins) {
    return <LoadingState label="Loading your Pins…" />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-accent mb-3 text-xs font-semibold tracking-[0.16em] uppercase">
            Pincrest / Your collection
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Your Pins
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Revisit your ideas and save the ones you want to keep close.
          </p>
        </div>
        <Link
          href="/boards"
          className="border-border bg-surface hover:bg-surface-muted inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none"
        >
          View Boards
        </Link>
      </header>

      {pins.length === 0 ? (
        <div className="border-border bg-surface rounded-lg border px-6 py-12 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            Your collection is ready for its first Pin
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-6">
            Pins on your account will appear here. Open any Pin to save it to a
            Board.
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
          {pins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              action={<SavePinButton pinId={pin.id} pinTitle={pin.title} />}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface PinDetailPageProps {
  pinId: string;
}

export function PinDetailPage({ pinId }: PinDetailPageProps) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    void getPin(pinId, controller.signal)
      .then((result) => {
        setPin(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load the selected Pin.", cause);
          setError(getErrorMessage(cause));
        }
      });

    return () => controller.abort();
  }, [pinId, retryCount]);

  if (error) {
    return (
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <ErrorState
          title="This Pin could not be loaded"
          description={error}
          onRetry={() => {
            setPin(null);
            setError(null);
            setRetryCount((current) => current + 1);
          }}
        />
      </section>
    );
  }

  if (!pin) {
    return <LoadingState label="Loading Pin…" />;
  }

  const destinationUrl = getSafeDestinationUrl(pin.destinationUrl);

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex min-h-11 items-center rounded-sm text-sm font-medium transition-colors motion-reduce:transition-none"
      >
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        Back
      </button>

      <article className="border-border bg-surface grid overflow-hidden rounded-lg border shadow-sm md:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="bg-surface-muted relative min-h-[20rem] md:min-h-[36rem]">
          <PinImage
            src={pin.imageUrl}
            alt={pin.title}
            className="size-full"
            sizes="(max-width: 768px) 100vw, 55vw"
          />
        </div>
        <div className="flex flex-col p-6 sm:p-9">
          <p className="text-accent text-xs font-semibold tracking-[0.16em] uppercase">
            Pincrest / Pin detail
          </p>
          <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {pin.title}
          </h1>
          {pin.description ? (
            <p className="text-muted-foreground mt-5 text-base leading-7 whitespace-pre-wrap">
              {pin.description}
            </p>
          ) : null}
          {destinationUrl ? (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="text-accent hover:text-accent-hover mt-5 inline-flex min-h-11 items-center self-start rounded-sm text-sm font-semibold underline underline-offset-4"
            >
              Visit source
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          <div className="mt-auto pt-8">
            <SavePinButton pinId={pin.id} pinTitle={pin.title} />
          </div>
        </div>
      </article>
    </section>
  );
}
