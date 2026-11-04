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
    <header className="bg-surface/95 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link
          href="/"
          aria-label="Pincrest home"
          className="text-foreground hover:text-accent inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full transition-colors motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="bg-accent size-2.5 rounded-full"
          />
          <span className="text-xl font-bold tracking-tight">Pincrest</span>
        </Link>

        <form
          role="search"
          aria-label="Search Pincrest"
          onSubmit={handleSearchSubmit}
          className="order-3 flex w-full sm:order-none sm:min-w-40 sm:flex-1"
        >
          <label className="sr-only" htmlFor="site-search">
            Search Pins and people
          </label>
          <div className="focus-within:ring-accent/25 bg-surface-muted flex w-full items-center gap-2 rounded-full p-1.5 pl-5 focus-within:ring-2">
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
              className="text-foreground placeholder:text-muted-foreground min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors motion-reduce:transition-none"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-5"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path strokeLinecap="round" d="m16 16 4.5 4.5" />
              </svg>
            </button>
          </div>
        </form>

        <nav
          className="order-4 w-full overflow-x-auto sm:order-none sm:w-auto"
          aria-label="Primary navigation"
        >
          <ul className="flex min-w-max items-center gap-1 sm:justify-end">
            <li>
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors motion-reduce:transition-none sm:px-4 ${pathname === "/" ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-surface-muted"}`}
              >
                Discover
              </Link>
            </li>
            <li>
              <Link
                href="/profile/pins"
                aria-current={pathname === "/profile/pins" ? "page" : undefined}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors motion-reduce:transition-none sm:px-4 ${pathname === "/profile/pins" ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-surface-muted"}`}
              >
                Your Pins
              </Link>
            </li>
            <li>
              <Link
                href="/boards"
                aria-current={
                  pathname.startsWith("/boards") ? "page" : undefined
                }
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors motion-reduce:transition-none sm:px-4 ${pathname.startsWith("/boards") ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-surface-muted"}`}
              >
                Boards
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                aria-current={
                  pathname === "/profile" ||
                  pathname.startsWith("/users/") ||
                  pathname === "/settings/profile"
                    ? "page"
                    : undefined
                }
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors motion-reduce:transition-none sm:px-4 ${pathname === "/profile" || pathname.startsWith("/users/") || pathname === "/settings/profile" ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-surface-muted"}`}
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
                  className="text-foreground hover:bg-surface-muted inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:px-4"
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
          className="text-danger mx-auto max-w-[1800px] px-5 pb-3 text-sm sm:px-8"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  );
}
