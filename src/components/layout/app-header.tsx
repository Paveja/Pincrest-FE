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
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function AppHeader() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
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
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
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
          <ul className="flex items-center gap-2">
            <li>
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
            <li>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                {isLoggingOut ? "Signing out…" : "Log out"}
              </button>
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
          className="text-danger mx-auto max-w-6xl px-5 pb-3 text-sm sm:px-8"
          role="alert"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  );
}
