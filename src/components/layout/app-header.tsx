"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function AppHeader() {
  const { status, isLoggingOut, logout } = useAuth();
  const [logoutError, setLogoutError] = useState(false);

  async function handleLogout() {
    setLogoutError(false);

    try {
      await logout();
    } catch (error) {
      console.error("Unable to end the Pincrest session.", error);
      setLogoutError(true);
    }
  }

  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5 sm:px-8">
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

        <nav aria-label="Primary navigation">
          <ul>
            <li className="flex items-center gap-2">
              <Link
                href="/"
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors motion-reduce:transition-none"
              >
                Home
              </Link>
              {status === "authenticated" ? (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                  className="text-muted-foreground hover:bg-surface-muted hover:text-foreground active:bg-surface-muted inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                >
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </button>
              ) : null}
            </li>
          </ul>
        </nav>
      </div>
      {logoutError ? (
        <p
          role="alert"
          className="text-danger px-5 pb-3 text-right text-sm sm:px-8"
        >
          Unable to sign out. Try again.
        </p>
      ) : null}
    </header>
  );
}
