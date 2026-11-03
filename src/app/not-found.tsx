import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function NotFound() {
  return (
    <AppShell>
      <EmptyState
        title="Page not found"
        description="That page does not exist or may have moved."
        action={
          <Link
            href="/"
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors motion-reduce:transition-none"
          >
            Return home
          </Link>
        }
      />
    </AppShell>
  );
}
