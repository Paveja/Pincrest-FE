"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { useAuth } from "@/components/auth/auth-provider";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const { status, error, refreshSession } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "authenticated") {
    return children;
  }

  if (status === "error") {
    return (
      <main className="min-h-screen px-6 py-12">
        <ErrorState
          title="We couldn’t confirm your session"
          description={error ?? "Check your connection and try again."}
          onRetry={() => void refreshSession()}
        />
      </main>
    );
  }

  return <LoadingState label="Checking your session…" />;
}
