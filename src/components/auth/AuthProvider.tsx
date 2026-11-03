"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AuthApiError, checkCurrentSession } from "@/lib/auth";

type SessionStatus = "checking" | "authenticated" | "anonymous" | "unavailable";

type AuthContextValue = {
  status: SessionStatus;
  sessionError: string;
  refreshSession: () => Promise<SessionStatus>;
  markSignedOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFor(error: unknown): string {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  return "Pincrest couldn't check your session. Try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [sessionError, setSessionError] = useState("");

  const refreshSession = useCallback(async () => {
    setStatus("checking");
    setSessionError("");

    try {
      const authenticated = await checkCurrentSession();
      const nextStatus = authenticated ? "authenticated" : "anonymous";
      setStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      setSessionError(messageFor(error));
      setStatus("unavailable");
      return "unavailable";
    }
  }, []);

  const markSignedOut = useCallback(() => {
    setSessionError("");
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void checkCurrentSession(controller.signal)
      .then((authenticated) => {
        setStatus(authenticated ? "authenticated" : "anonymous");
        setSessionError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setSessionError(messageFor(error));
        setStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, sessionError, refreshSession, markSignedOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export function AuthLoading({
  label = "Checking your session",
}: {
  label?: string;
}) {
  return (
    <div className="loading-shell" role="status" aria-live="polite">
      <div className="loading-card">
        <span className="loading-mark" aria-hidden="true">
          <PineMark />
        </span>
        <p>{label}</p>
      </div>
    </div>
  );
}

export function SessionNotice() {
  const { status, sessionError, refreshSession } = useAuth();

  if (status !== "unavailable") {
    return null;
  }

  return (
    <div className="session-notice" role="alert">
      <span>{sessionError}</span>
      <button type="button" onClick={() => void refreshSession()}>
        Retry
      </button>
    </div>
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
