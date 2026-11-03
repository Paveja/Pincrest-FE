"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthApiError, logoutAccount } from "@/lib/auth";
import { AuthLoading, useAuth } from "./AuthProvider";
import { Brand } from "./Brand";

export function ProtectedFeed() {
  const router = useRouter();
  const { status, sessionError, refreshSession, markSignedOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "checking") {
    return <AuthLoading label="Verifying your Pincrest session" />;
  }

  if (status === "anonymous") {
    return <AuthLoading label="Taking you to sign in" />;
  }

  if (status === "unavailable") {
    return (
      <main className="feed-shell">
        <div className="feed-card">
          <span className="loading-mark" aria-hidden="true">
            <PineMark />
          </span>
          <h1>We can’t check your session.</h1>
          <p>{sessionError}</p>
          <button
            className="feed-retry"
            type="button"
            onClick={() => void refreshSession()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  async function handleLogout() {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await logoutAccount();
      markSignedOut();
      router.replace("/login");
    } catch (error) {
      const session = await refreshSession();

      if (session === "anonymous") {
        markSignedOut();
        router.replace("/login");
      } else {
        setLogoutError(
          error instanceof AuthApiError
            ? error.message
            : "We couldn't sign you out. Please try again.",
        );
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="feed-shell">
      <header className="feed-header">
        <Brand />
        <button
          className="logout-button"
          type="button"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </button>
      </header>

      <section className="feed-card" aria-labelledby="feed-heading">
        <span className="loading-mark" aria-hidden="true">
          <PineMark />
        </span>
        <p className="form-kicker">You’re in</p>
        <h1 id="feed-heading">Welcome to Pincrest.</h1>
        <p>Your home feed is ready for you.</p>
        {logoutError && (
          <p className="feed-error" role="alert">
            {logoutError}
          </p>
        )}
      </section>
    </main>
  );
}

function PineMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 4.5 8.7 14h4.5l-5.1 6.2h6.1v6h3.6v-6h6.1L18.8 14h4.5L16 4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
