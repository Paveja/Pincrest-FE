"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";

export function AppHeader() {
  const { logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setIsSigningOut(true);
    setLogoutError(null);

    try {
      await logout();
    } catch {
      setLogoutError(
        "Could not sign you out. Check your connection and try again.",
      );
    } finally {
      setIsSigningOut(false);
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
          <ul className="flex items-center gap-2">
            <li>
              <Link
                href="/"
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors motion-reduce:transition-none"
              >
                Home
              </Link>
            </li>
            <li>
              <button
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                disabled={isSigningOut}
                onClick={handleLogout}
                type="button"
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </li>
          </ul>
        </nav>
      </div>
      {logoutError ? (
        <p
          className="text-danger mx-auto max-w-6xl px-5 pb-3 text-sm sm:px-8"
          role="alert"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  );
}
