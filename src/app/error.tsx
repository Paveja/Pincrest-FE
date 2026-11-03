"use client";

import { ErrorState } from "@/components/states/error-state";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen px-6 py-12">
      <ErrorState
        title="Something went wrong"
        description="Pincrest could not load this page. Try again, or return to the home page."
        onRetry={reset}
      />
    </main>
  );
}
