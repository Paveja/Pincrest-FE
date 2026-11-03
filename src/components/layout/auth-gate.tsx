"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { useAuth } from "@/components/layout/auth-provider";

const publicAuthPaths = new Set(["/login", "/register"]);

function getSafeReturnPath(search: string, currentOrigin: string): string {
  const requestedPath = new URLSearchParams(search).get("next");

  if (!requestedPath || !requestedPath.startsWith("/")) {
    return "/";
  }

  let target: URL;

  try {
    target = new URL(requestedPath, currentOrigin);
  } catch {
    return "/";
  }

  if (target.origin !== currentOrigin || publicAuthPaths.has(target.pathname)) {
    return "/";
  }

  return `${target.pathname}${target.search}${target.hash}`;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { error, refreshSession, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicAuthPage = publicAuthPaths.has(pathname);

  useEffect(() => {
    if (status === "authenticated" && isPublicAuthPage) {
      router.replace(
        getSafeReturnPath(window.location.search, window.location.origin),
      );
      return;
    }

    if (status === "unauthenticated" && !isPublicAuthPage) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isPublicAuthPage, pathname, router, status]);

  if (status === "checking") {
    return <LoadingState label="Checking your session" />;
  }

  if (status === "error" && !isPublicAuthPage) {
    return (
      <main className="min-h-screen px-6 py-12">
        <ErrorState
          title="We couldn’t verify your session"
          description={error ?? "Check your connection and try again."}
          onRetry={() => {
            void refreshSession();
          }}
        />
      </main>
    );
  }

  if (status === "authenticated" && isPublicAuthPage) {
    return <LoadingState label="Opening your workspace" />;
  }

  if (status === "unauthenticated" && !isPublicAuthPage) {
    return <LoadingState label="Redirecting to sign in" />;
  }

  return children;
}
