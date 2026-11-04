"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinDetailDialog } from "@/components/pins/pin-detail-dialog";
import {
  masonryClassName,
  pinRatioAt,
  PinTile,
} from "@/components/pins/pin-tile";
import { SavePinDialog } from "@/components/boards/save-pin-dialog";
import { LoadingState } from "@/components/states/loading-state";
import { Notice } from "@/components/states/notice";
import { getSafeImageUrl } from "@/services/profile-api";
import { getSafeDestinationUrl, type Pin } from "@/services/pins";
import {
  searchPins,
  searchUsers,
  type SearchPage,
  type SearchUser,
} from "@/services/search";

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
  const [notice, setNotice] = useState<string | null>(null);

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
    <section className="mx-auto w-full max-w-[120rem] px-3 pt-2 pb-10 sm:px-5">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {query ? (
            <>
              Results for{" "}
              <span className="break-words">“{query}”</span>
            </>
          ) : (
            "Search"
          )}
        </h1>

        <div
          role="group"
          className="flex flex-wrap justify-center gap-2"
          aria-label="Search result type"
        >
          <button
            type="button"
            aria-pressed={type === "pins"}
            onClick={() => updateSearchParams({ type: "pins", page: "1" })}
            className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors motion-reduce:transition-none ${
              type === "pins"
                ? "bg-foreground text-background"
                : "bg-surface-muted text-foreground hover:bg-border"
            }`}
          >
            Pins
          </button>
          <button
            type="button"
            aria-pressed={type === "users"}
            onClick={() => updateSearchParams({ type: "users", page: "1" })}
            className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors motion-reduce:transition-none ${
              type === "users"
                ? "bg-foreground text-background"
                : "bg-surface-muted text-foreground hover:bg-border"
            }`}
          >
            People
          </button>
        </div>
      </header>

      {notice ? <Notice>{notice}</Notice> : null}

      {!query ? (
        <section
          role="status"
          className="bg-surface-muted mx-auto mt-8 max-w-2xl rounded-3xl px-6 py-14 text-center sm:py-16"
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
        <div className="mt-8" aria-live="polite">
          <LoadingState
            label={type === "pins" ? "Searching Pins" : "Searching people"}
          />
        </div>
      ) : currentError ? (
        <section
          role="alert"
          className="bg-surface-muted mx-auto mt-8 max-w-2xl rounded-3xl px-6 py-12 text-center"
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
            className="bg-accent text-accent-foreground hover:bg-accent-hover mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors motion-reduce:transition-none"
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
            <ul className={`mt-5 ${masonryClassName}`}>
              {currentResponse.results.items.map((pin, index) => (
                <PinTile
                  key={pin.id}
                  title={pin.title}
                  description={pin.description}
                  imageUrl={getSafeDestinationUrl(pin.imageUrl)}
                  ratio={pinRatioAt(index)}
                  onOpen={() => setDetailPin(pin)}
                  onSave={() => {
                    setNotice(null);
                    setSavePin(pin);
                  }}
                />
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
            <ul className="mx-auto mt-5 grid max-w-5xl gap-2 sm:grid-cols-2">
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
          onSaved={(board) => setNotice(`Saved to ${board.name}.`)}
        />
      ) : null}
    </section>
  );
}

function ResultsCount({ total, type }: { total: number; type: string }) {
  return (
    <p
      className="text-muted-foreground mt-4 text-center text-sm"
      aria-live="polite"
    >
      {total.toLocaleString()}{" "}
      {total === 1 ? type : type === "person" ? "people" : `${type}s`} found
    </p>
  );
}

function EmptySearchResults({ type, query }: { type: string; query: string }) {
  return (
    <section
      role="status"
      className="bg-surface-muted mx-auto mt-8 max-w-2xl rounded-3xl px-6 py-14 text-center"
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
        className="hover:bg-surface-muted focus-visible:bg-surface-muted flex min-h-20 items-center gap-4 rounded-3xl px-4 py-4 transition-colors motion-reduce:transition-none"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-surface-muted text-foreground grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold"
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
      className="mt-8 flex items-center justify-center gap-4"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="bg-surface-muted text-foreground hover:bg-border inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
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
        className="bg-surface-muted text-foreground hover:bg-border inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      >
        Next
      </button>
    </nav>
  );
}
