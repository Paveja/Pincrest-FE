"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/services/api-client";
import { endSession, getCurrentSession } from "@/services/auth";

export type AuthStatus =
  "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthContextValue {
  status: AuthStatus;
  error: string | null;
  refreshSession: (signal?: AbortSignal) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async (signal?: AbortSignal) => {
    try {
      await getCurrentSession(signal);
      if (!signal?.aborted) {
        setStatus("authenticated");
        setError(null);
      }
      return true;
    } catch (cause) {
      if (signal?.aborted) {
        return false;
      }

      if (cause instanceof ApiError && cause.status === 401) {
        setStatus("unauthenticated");
        setError(null);
        return false;
      }

      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to check your session. Try again.",
      );
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await endSession();
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.status === 401)) {
        throw cause;
      }
    }

    setStatus("unauthenticated");
    setError(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getCurrentSession(controller.signal).then(
      () => {
        if (!controller.signal.aborted) {
          setStatus("authenticated");
          setError(null);
        }
      },
      (cause: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (cause instanceof ApiError && cause.status === 401) {
          setStatus("unauthenticated");
          setError(null);
          return;
        }

        setStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to check your session. Try again.",
        );
      },
    );

    return () => controller.abort();
  }, []);

  return (
    <AuthContext.Provider value={{ status, error, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
