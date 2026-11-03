"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

const navigationItems = [
  { href: "/pins", label: "Pins" },
  { href: "/boards", label: "Boards" },
];

export function AppHeader() {
  const pathname = usePathname();
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
      console.error("Unable to end the Pincrest session.", cause);
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
          href="/pins"
          aria-label="Pincrest Pins"
          className="text-foreground hover:text-accent-hover inline-flex min-h-11 items-center gap-3 rounded-md transition-colors motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-accent-foreground grid size-8 place-items-center rounded-md text-sm font-bold"
          >
            P
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            Pincrest
          </span>
        </Link>

        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-1 sm:gap-2">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors motion-reduce:transition-none sm:px-4 ${
                      isActive
                        ? "text-accent border-accent border-b-2"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
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
