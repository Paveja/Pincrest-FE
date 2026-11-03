import type { ReactNode } from "react";
import { Brand } from "./Brand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside" aria-label="About Pincrest">
        <Brand />
        <div className="aside-copy">
          <p className="aside-kicker">A place to gather</p>
          <h1>Keep what matters close.</h1>
          <p>Find your people and make room for the things you love.</p>
        </div>
        <p className="aside-footnote">
          A little corner of Pincrest, just for you.
        </p>
      </aside>

      <section className="auth-main" aria-label="Account access">
        <div className="auth-content">
          <div className="mobile-brand">
            <Brand />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
