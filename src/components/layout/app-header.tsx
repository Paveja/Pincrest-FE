"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const NAV_ITEMS = [
  { href: "/", label: "Discover" },
  { href: "/profile/pins", label: "Your Pins" },
  { href: "/boards", label: "Boards" },
  { href: "/profile", label: "Profile" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/profile") {
    return pathname === "/profile" || pathname.startsWith("/settings");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkBase =
  "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors motion-reduce:transition-none";

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
    <header className="bg-surface sticky top-0 z-30">
      <div className="mx-auto flex max-w-[120rem] flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 sm:px-5 lg:flex-nowrap lg:gap-x-3">
        <Link
          href="/"
          aria-label="Pincrest home"
          className="text-accent hover:bg-surface-muted inline-flex min-h-11 items-center gap-2 rounded-full pr-3 pl-1 transition-colors motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-accent-foreground grid size-9 place-items-center rounded-full text-lg font-bold"
          >
            P
          </span>
          <span className="hidden text-xl font-bold tracking-tight sm:inline">
            Pincrest
          </span>
        </Link>

        <nav
          className="order-3 -mx-1 w-full overflow-x-auto lg:order-none lg:mx-0 lg:w-auto lg:overflow-visible"
          aria-label="Primary navigation"
        >
          <ul className="flex items-center gap-1 px-1 lg:px-0">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${navLinkBase} ${
                      active
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <form
          role="search"
          aria-label="Search Pincrest"
          onSubmit={handleSearchSubmit}
          className="order-2 min-w-0 flex-1 lg:order-none"
        >
          <label className="sr-only" htmlFor="site-search">
            Search Pins and people
          </label>
          <div className="bg-surface-muted focus-within:outline-foreground relative flex items-center rounded-full focus-within:outline-2 focus-within:outline-offset-2">
            <button
              type="submit"
              aria-label="Search"
              className="text-muted-foreground hover:text-foreground absolute left-1 inline-flex size-11 items-center justify-center rounded-full transition-colors motion-reduce:transition-none"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="size-5"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-4.2-4.2" />
              </svg>
            </button>
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
              className="text-foreground placeholder:text-muted-foreground h-12 w-full rounded-full bg-transparent pr-4 pl-12 text-base outline-none"
            />
          </div>
        </form>

        {status === "authenticated" ? (
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className={`${navLinkBase} text-foreground hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60`}
          >
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : null}
      </div>
      {logoutError ? (
        <p
          role="alert"
          className="text-danger mx-auto max-w-[120rem] px-5 pb-3 text-sm"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  );
}
