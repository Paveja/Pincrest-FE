import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function HomePage() {
  return (
    <RequireAuth>
      <AppShell>
        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
          <p className="text-muted-foreground mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase">
            <span
              aria-hidden="true"
              className="bg-accent h-5 w-1 rounded-full"
            />
            Pincrest / Application shell
          </p>
          <h1 className="text-foreground max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.12]">
            A clear place to begin.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">
            The Pincrest frontend foundation is ready. Feature pages can grow
            here with shared navigation and a single connection to the backend
            API.
          </p>
        </section>
      </AppShell>
    </RequireAuth>
  );
}

export const metadata = {
  title: "Pincrest",
};
