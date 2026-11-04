"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinDetailDialog } from "@/components/pins/pin-detail-dialog";
import { SavePinDialog } from "@/components/boards/save-pin-dialog";
import { LoadingState } from "@/components/states/loading-state";
import { getSafeImageUrl } from "@/services/profile-api";
import { getSafeDestinationUrl, type Pin } from "@/services/pins";
import {
  searchPins,
  searchUsers,
  type SearchPage,
  type SearchUser,
} from "@/services/search";

const PIN_IMAGE_RATIOS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square"];

type SearchType = "pins" | "users";
type SearchData =
  | { type: "pins"; results: SearchPage<Pin> }
  | { type: "users"; results: SearchPage<SearchUser> };

interface KeyedSearchData {
  key: string;
  data: SearchData;
}

interface KeyedSearchError {
  key: string;
  error: Error;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function asError(value: unknown): Error {
  return value instanceof Error
    ? value
    : new Error("Search results could not be loaded. Try again.");
}

export function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const type: SearchType =
    searchParams.get("type") === "users" ? "users" : "pins";
  const page = parsePage(searchParams.get("page"));
  const [retryKey, setRetryKey] = useState(0);
  const requestKey = `${type}:${query}:${page}:${retryKey}`;
  const [response, setResponse] = useState<KeyedSearchData | null>(null);
  const [failure, setFailure] = useState<KeyedSearchError | null>(null);
  const [detailPin, setDetailPin] = useState<Pin | null>(null);
  const [savePin, setSavePin] = useState<Pin | null>(null);

  useEffect(() => {
    if (!query) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadResults() {
      try {
        const data: SearchData =
          type === "pins"
            ? {
                type: "pins",
                results: await searchPins(query, page, controller.signal),
              }
            : {
                type: "users",
                results: await searchUsers(query, page, controller.signal),
              };

        if (active) {
          setResponse({ key: requestKey, data });
        }
      } catch (cause) {
        if (active && !controller.signal.aborted) {
          setFailure({ key: requestKey, error: asError(cause) });
        }
      }
    }

    void loadResults();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, query, requestKey, retryKey, type]);

  function updateSearchParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    router.push(`/search?${params.toString()}`);
  }

  const currentResponse = response?.key === requestKey ? response.data : null;
  const currentError = failure?.key === requestKey ? failure.error : null;
  const isLoading = Boolean(query && !currentResponse && !currentError);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
      <header className="border-border flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-accent mb-2 text-xs font-semibold tracking-[0.16em] uppercase">
            Pincrest / Explore
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Search
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6 sm:text-base">
            Find Pins to save and people to follow.
          </p>
        </div>
        {query ? (
          <p className="text-muted-foreground max-w-full truncate text-sm sm:max-w-80">
            Results for{" "}
            <span className="text-foreground font-medium">“{query}”</span>
          </p>
        ) : null}
      </header>

      <div
        role="group"
        className="border-border mt-5 flex flex-wrap gap-2 border-b"
        aria-label="Search result type"
      >
        <button
          type="button"
          aria-pressed={type === "pins"}
          onClick={() => updateSearchParams({ type: "pins", page: "1" })}
          className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${
            type === "pins"
              ? "border-accent text-accent"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          Pins
        </button>
        <button
          type="button"
          aria-pressed={type === "users"}
          onClick={() => updateSearchParams({ type: "users", page: "1" })}
          className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${
            type === "users"
              ? "border-accent text-accent"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          People
        </button>
      </div>

      {!query ? (
        <section
          role="status"
          className="border-border bg-surface mt-7 rounded-lg border px-6 py-12 text-center sm:py-16"
        >
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            What are you looking for?
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-6">
            Search for a place, an idea, or a Pincrest creator using the search
            bar above.
          </p>
        </section>
      ) : isLoading ? (
        <div className="mt-7" aria-live="polite">
          <LoadingState
            label={type === "pins" ? "Searching Pins" : "Searching people"}
          />
        </div>
      ) : currentError ? (
        <section
          role="alert"
          className="border-border bg-surface mt-7 rounded-lg border px-6 py-10 text-center"
        >
          <h2 className="text-foreground text-lg font-semibold">
            Search isn’t available right now
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-6">
            {currentError.message}
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="bg-accent text-accent-foreground hover:bg-accent-hover mt-5 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Try again
          </button>
        </section>
      ) : currentResponse?.type === "pins" ? (
        currentResponse.results.items.length === 0 ? (
          <>
            <EmptySearchResults type="Pins" query={query} />
            <Pagination
              page={page}
              pagination={currentResponse.results.pagination}
              onChange={(nextPage) =>
                updateSearchParams({ page: String(nextPage) })
              }
            />
          </>
        ) : (
          <>
            <ResultsCount
              total={currentResponse.results.pagination.total}
              type="Pin"
            />
            <ul className="mt-5 columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
              {currentResponse.results.items.map((pin, index) => {
                const imageUrl = getSafeDestinationUrl(pin.imageUrl);
                const ratio = PIN_IMAGE_RATIOS[index % PIN_IMAGE_RATIOS.length];

                return (
                  <li key={pin.id} className="mb-4 break-inside-avoid sm:mb-5">
                    <article className="group border-border bg-surface overflow-hidden rounded-lg border">
                      <div
                        className={`bg-surface-muted relative overflow-hidden ${ratio}`}
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={pin.title}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                          />
                        ) : (
                          <span className="text-muted-foreground grid h-full place-items-center px-4 text-center text-sm">
                            Image unavailable
                          </span>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <h2 className="text-foreground line-clamp-2 text-sm leading-5 font-semibold sm:text-base">
                          {pin.title}
                        </h2>
                        {pin.description ? (
                          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-5">
                            {pin.description}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setDetailPin(pin)}
                          aria-label={`View Pin details for ${pin.title}`}
                          className="border-border text-foreground hover:bg-surface-muted mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
                        >
                          View Pin
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={page}
              pagination={currentResponse.results.pagination}
              onChange={(nextPage) =>
                updateSearchParams({ page: String(nextPage) })
              }
            />
          </>
        )
      ) : currentResponse?.type === "users" ? (
        currentResponse.results.items.length === 0 ? (
          <>
            <EmptySearchResults type="people" query={query} />
            <Pagination
              page={page}
              pagination={currentResponse.results.pagination}
              onChange={(nextPage) =>
                updateSearchParams({ page: String(nextPage) })
              }
            />
          </>
        ) : (
          <>
            <ResultsCount
              total={currentResponse.results.pagination.total}
              type="person"
            />
            <ul className="border-border bg-surface divide-border mt-5 divide-y rounded-lg border">
              {currentResponse.results.items.map((user) => (
                <UserResult key={user.id} user={user} />
              ))}
            </ul>
            <Pagination
              page={page}
              pagination={currentResponse.results.pagination}
              onChange={(nextPage) =>
                updateSearchParams({ page: String(nextPage) })
              }
            />
          </>
        )
      ) : null}

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
          onSaved={() => undefined}
        />
      ) : null}
    </section>
  );
}

function ResultsCount({ total, type }: { total: number; type: string }) {
  return (
    <p className="text-muted-foreground mt-5 text-sm" aria-live="polite">
      {total.toLocaleString()}{" "}
      {total === 1 ? type : type === "person" ? "people" : `${type}s`} found
    </p>
  );
}

function EmptySearchResults({ type, query }: { type: string; query: string }) {
  return (
    <section
      role="status"
      className="border-border bg-surface mt-5 rounded-lg border px-6 py-12 text-center"
    >
      <h2 className="text-foreground text-lg font-semibold">
        No {type} found for “{query}”
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-6">
        Try a different keyword or a broader phrase.
      </p>
    </section>
  );
}

function UserResult({ user }: { user: SearchUser }) {
  const imageUrl = getSafeImageUrl(user.profileImage);
  const displayName = user.name.trim() || user.username;
  const initial = displayName.charAt(0).toLocaleUpperCase() || "P";

  return (
    <li>
      <Link
        href={`/users/${encodeURIComponent(user.username)}`}
        className="hover:bg-surface-muted focus-visible:bg-surface-muted flex min-h-20 items-center gap-4 px-4 py-4 transition-colors motion-reduce:transition-none sm:px-6"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="border-border size-12 shrink-0 rounded-full border object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-surface-muted text-accent border-border grid size-12 shrink-0 place-items-center rounded-full border text-base font-semibold"
          >
            {initial}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate font-semibold">
            {displayName}
          </span>
          <span className="text-muted-foreground mt-0.5 block truncate text-sm">
            @{user.username}
          </span>
          {user.bio ? (
            <span className="text-muted-foreground mt-1 line-clamp-2 block text-sm leading-5">
              {user.bio}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className="text-muted-foreground shrink-0 text-lg"
        >
          →
        </span>
      </Link>
    </li>
  );
}

function Pagination({
  page,
  pagination,
  onChange,
}: {
  page: number;
  pagination: SearchPage<unknown>["pagination"];
  onChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Search result pages"
      className="border-border mt-8 flex items-center justify-between gap-4 border-t pt-5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      >
        Previous
      </button>
      <p className="text-muted-foreground text-center text-sm tabular-nums">
        Page {page} of {pagination.totalPages}
      </p>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pagination.totalPages}
        className="border-border text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      >
        Next
      </button>
    </nav>
  );
}
