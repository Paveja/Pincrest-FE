import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="auth-page-shell min-h-screen">
      <header className="relative z-10 mx-auto flex h-20 max-w-6xl items-center px-5 sm:px-8">
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

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 px-5 pt-2 pb-10 sm:gap-8 sm:px-8 md:min-h-[calc(100vh-5rem)] md:grid-cols-[minmax(0,1fr)_minmax(22rem,0.86fr)] md:items-center md:gap-16 md:pb-20">
        <aside className="auth-hero-panel text-accent-foreground relative isolate flex min-h-40 overflow-hidden rounded-3xl px-6 py-5 sm:min-h-48 md:min-h-[31rem] md:items-start md:p-10 lg:p-12">
          <div
            className="auth-pin-collage pointer-events-none absolute"
            aria-hidden="true"
          >
            <div className="auth-pin auth-pin--sunset">
              <svg viewBox="0 0 160 190" fill="none">
                <rect width="160" height="190" fill="var(--auth-card-cream)" />
                <circle
                  cx="112"
                  cy="50"
                  r="22"
                  fill="var(--auth-card-yellow)"
                />
                <path
                  d="M0 132 45 87l35 34 25-25 55 53v41H0z"
                  fill="var(--auth-card-coral)"
                />
                <path
                  d="m0 153 50-32 35 27 34-23 41 24v41H0z"
                  fill="var(--auth-card-peach)"
                />
              </svg>
              <span>Little places</span>
            </div>
            <div className="auth-pin auth-pin--studio">
              <svg viewBox="0 0 160 190" fill="none">
                <rect width="160" height="190" fill="var(--auth-card-lilac)" />
                <circle cx="37" cy="40" r="20" fill="var(--auth-card-yellow)" />
                <path d="M25 86h112v104H25z" fill="var(--auth-card-cream)" />
                <path d="M17 91 81 45l68 46z" fill="var(--auth-card-ink)" />
                <path
                  d="M43 111h23v30H43zm47 0h27v30H90z"
                  fill="var(--auth-card-coral)"
                />
                <path d="M73 151h19v39H73z" fill="var(--auth-card-peach)" />
              </svg>
              <span>Color for later</span>
            </div>
            <div className="auth-pin auth-pin--flower">
              <svg viewBox="0 0 120 120" fill="none">
                <rect width="120" height="120" fill="var(--auth-card-yellow)" />
                <path
                  d="M60 48v55"
                  stroke="var(--auth-card-ink)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M59 82c-21-3-26-17-26-17 16-5 28 2 27 17Zm2-13c1-17 14-25 14-25 9 14 1 26-14 25Z"
                  fill="var(--auth-card-coral)"
                />
                <circle cx="59" cy="38" r="12" fill="var(--auth-card-ink)" />
                <circle cx="59" cy="19" r="9" fill="var(--auth-card-cream)" />
                <circle cx="78" cy="38" r="9" fill="var(--auth-card-cream)" />
                <circle cx="59" cy="57" r="9" fill="var(--auth-card-cream)" />
                <circle cx="40" cy="38" r="9" fill="var(--auth-card-cream)" />
              </svg>
              <span>Make it yours</span>
            </div>
          </div>
          <div className="auth-hero-copy relative z-10">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-85">
              Your Pincrest
            </p>
            <h2 className="mt-2 max-w-[15ch] text-2xl leading-[1.08] font-semibold tracking-tight sm:text-3xl md:mt-5 md:text-4xl lg:text-[2.75rem]">
              Find your place in the conversation.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 opacity-90 md:mt-4">
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
