"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, SESSION_EXPIRED_EVENT } from "@/services/api-client";
import {
  invalidateSession,
  loginWithCredentials,
  registerAccount,
  requestCurrentUser,
  type AuthUser,
} from "@/services/auth";

export type AuthStatus =
  "checking" | "authenticated" | "unauthenticated" | "error";

interface RegistrationInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  refreshSession: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setStatus("checking");
    setError(null);

    try {
      const currentUser = await requestCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        return null;
      }

      const message =
        cause instanceof Error
          ? cause.message
          : "Pincrest could not verify your session.";
      setUser(null);
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginWithCredentials(email, password);
      const currentUser = await refreshSession();

      if (!currentUser) {
        throw new ApiError(
          "Login succeeded, but Pincrest could not restore your session. Try again.",
          null,
        );
      }
    },
    [refreshSession],
  );

  const register = useCallback(
    async (input: RegistrationInput) => {
      await registerAccount(input);
      const currentUser = await refreshSession();

      if (!currentUser) {
        throw new ApiError(
          "Your account was created, but Pincrest could not restore your session. Try signing in.",
          null,
        );
      }
    },
    [refreshSession],
  );

  const logout = useCallback(async () => {
    try {
      await invalidateSession();
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.status !== 401) {
        throw cause;
      }
    }

    setUser(null);
    setError(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshSession);
  }, [refreshSession]);

  useEffect(() => {
    const clearExpiredSession = () => {
      setUser(null);
      setError(null);
      setStatus("unauthenticated");
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, clearExpiredSession);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, clearExpiredSession);
    };
  }, []);

  const value = useMemo(
    () => ({ user, status, error, refreshSession, login, register, logout }),
    [user, status, error, refreshSession, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
