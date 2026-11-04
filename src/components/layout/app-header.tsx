"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AppHeader() {
  const router = useRouter();
  const { status, isLoggingOut, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);

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
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2 sm:flex-nowrap sm:gap-4 sm:px-8 sm:py-0">
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

        <nav className="w-full sm:w-auto" aria-label="Primary navigation">
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
