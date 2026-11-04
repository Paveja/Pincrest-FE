import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="bg-background min-h-screen">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-5 sm:px-8">
        <Link
          href="/login"
          aria-label="Pincrest sign in"
          className="text-foreground inline-flex min-h-11 items-center gap-3 rounded-md"
        >
          <span
            aria-hidden="true"
            className="bg-accent text-accent-foreground grid size-9 place-items-center rounded-md text-sm font-bold"
          >
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">Pincrest</span>
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-10 sm:px-8 md:min-h-[calc(100vh-5rem)] md:grid-cols-[minmax(0,1fr)_minmax(22rem,0.86fr)] md:items-center md:gap-16 md:pb-20">
        <aside className="bg-surface-muted text-foreground relative hidden overflow-hidden rounded-3xl p-10 md:block lg:p-12">
          <svg
            aria-hidden="true"
            viewBox="0 0 500 300"
            fill="none"
            className="text-accent/20 pointer-events-none absolute -right-12 -bottom-10 w-[90%]"
          >
            <path
              d="M-20 236 92 126l46 47 80-93 62 77 42-48 115 127"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M-20 264 90 154l48 48 80-92 62 77 43-49 113 126"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M-20 292 90 182l48 48 80-92 62 77 43-49 113 126"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div className="relative max-w-sm">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">
              Your Pincrest
            </p>
            <h2 className="mt-5 text-3xl leading-tight font-semibold tracking-tight lg:text-4xl">
              Find your place in the conversation.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-6 opacity-85">
              A thoughtful feed, ready when you are.
            </p>
          </div>
        </aside>

        <div className="mx-auto flex w-full max-w-md items-center md:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}
