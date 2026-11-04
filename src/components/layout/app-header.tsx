"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, isLoggingOut, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    },
    [pathname, searchParams],
  );

  function handleSearchChange(value: string) {
    if (pathname !== "/search") {
      return;
    }

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const query = value.trim();

      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      params.set("page", "1");
      const search = params.toString();
      router.replace(search ? `/search?${search}` : "/search", {
        scroll: false,
      });
    }, 300);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }

    const query = searchInputRef.current?.value.trim() ?? "";
    if (!query) {
      if (pathname === "/search") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        params.set("page", "1");
        const search = params.toString();
        router.replace(search ? `/search?${search}` : "/search", {
          scroll: false,
        });
      }
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    params.set(
      "type",
      pathname === "/search" ? (searchParams.get("type") ?? "pins") : "pins",
    );
    params.set("page", "1");
    const destination = `/search?${params.toString()}`;

    if (pathname === "/search") {
      router.replace(destination, { scroll: false });
    } else {
      router.push(destination, { scroll: false });
    }
  }

  async function handleLogout() {
    setLogoutError(null);

    try {
      await logout();
      router.replace("/login");
    } catch (cause) {
      setLogoutError(
        cause instanceof Error
          ? cause.message
          : "We couldn’t sign you out. Please try again.",
      );
    }
  }

  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2 lg:flex-nowrap lg:gap-4 lg:px-8 lg:py-0">
        <Link
          href="/"
          aria-label="Pincrest home"
          className="text-foreground hover:text-accent-hover inline-flex min-h-11 items-center gap-3 rounded-md transition-colors motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-accent-foreground grid size-8 place-items-center rounded-md text-sm font-bold"
          >
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">Pincrest</span>
        </Link>

        <form
          role="search"
          aria-label="Search Pincrest"
          onSubmit={handleSearchSubmit}
          className="order-2 flex w-full sm:order-none sm:max-w-xl sm:min-w-48 sm:flex-1"
        >
          <label className="sr-only" htmlFor="site-search">
            Search Pins and people
          </label>
          <div className="relative flex-1">
            <input
              key={`${pathname}:${searchParams.get("q") ?? ""}`}
              ref={searchInputRef}
              id="site-search"
              type="search"
              defaultValue={
                pathname === "/search" ? (searchParams.get("q") ?? "") : ""
              }
              onChange={(event) => handleSearchChange(event.target.value)}
              maxLength={120}
              placeholder="Search Pins and people"
              autoComplete="off"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-accent h-11 w-full rounded-md border py-2 pr-20 pl-3 text-sm transition-colors outline-none motion-reduce:transition-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-accent text-accent-foreground hover:bg-accent-hover absolute top-1/2 right-1 inline-flex min-h-11 -translate-y-1/2 items-center justify-center rounded px-3 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              Search
            </button>
          </div>
        </form>

        <nav
          className="order-3 w-full sm:order-none sm:w-auto"
          aria-label="Primary navigation"
        >
          <ul className="flex items-center justify-between gap-0.5 sm:justify-end sm:gap-1">
            <li>
              <Link
                href="/"
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors motion-reduce:transition-none sm:px-4"
              >
                Your Pins
              </Link>
            </li>
            <li>
              <Link
                href="/boards"
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors motion-reduce:transition-none sm:px-4"
              >
                Boards
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors motion-reduce:transition-none sm:px-4"
              >
                Profile
              </Link>
            </li>
            {status === "authenticated" ? (
              <li>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                  className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:px-4"
                >
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
      {logoutError ? (
        <p
          role="alert"
          className="text-danger mx-auto max-w-6xl px-5 pb-3 text-sm sm:px-8"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  );
}
