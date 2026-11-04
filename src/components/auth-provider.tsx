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
import { usePathname, useRouter } from "next/navigation";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import {
  ApiError,
  apiRequest,
  AUTH_UNAUTHORIZED_EVENT,
} from "@/services/api-client";

export type AuthUser = Record<string, unknown>;

type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "error";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  isLoggingOut: boolean;
  refreshSession: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAuthUser(payload: unknown): AuthUser {
  const data =
    isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const user = isRecord(data) && "user" in data ? data.user : data;

  if (!isRecord(user) || Object.keys(user).length === 0) {
    throw new Error("The authentication service returned an invalid user.");
  }

  return user;
}

async function loadCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiRequest<unknown>("api/v1/auth/me");
    return parseAuthUser(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

function isPublicAuthPath(pathname: string): boolean {
  const isAuthPath =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/");
  const isPublicUserPath = pathname.startsWith("/users/");
  const isPublicBoardPath = /^\/boards\/[^/]+\/?$/.test(pathname);

  return isAuthPath || isPublicUserPath || isPublicBoardPath;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshSession = useCallback(async () => {
    setStatus("checking");
    setError(null);

    try {
      const authenticatedUser = await loadCurrentUser();
      setUser(authenticatedUser);
      setStatus(authenticatedUser ? "authenticated" : "unauthenticated");
      return authenticatedUser;
    } catch (cause) {
      setUser(null);
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to check your session. Try again.",
      );
      throw cause;
    }
  }, []);

  useEffect(() => {
    let active = true;

    void loadCurrentUser()
      .then((authenticatedUser) => {
        if (active) {
          setUser(authenticatedUser);
          setStatus(authenticatedUser ? "authenticated" : "unauthenticated");
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setUser(null);
          setStatus("error");
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to check your session. Try again.",
          );
          console.error("Unable to restore the Pincrest session.", cause);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (
      status === "authenticated" &&
      (pathname === "/login" ||
        pathname.startsWith("/login/") ||
        pathname === "/register" ||
        pathname.startsWith("/register/"))
    ) {
      router.replace("/");
    } else if (status === "unauthenticated" && !isPublicAuthPath(pathname)) {
      router.replace("/login");
    }
  }, [pathname, router, status]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await apiRequest<unknown>("api/v1/auth/logout", { method: "POST" });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error;
      }
    } finally {
      setIsLoggingOut(false);
    }

    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const contextValue = useMemo(
    () => ({ user, status, error, isLoggingOut, refreshSession, logout }),
    [user, status, error, isLoggingOut, refreshSession, logout],
  );

  if (status === "error" && !isPublicAuthPath(pathname)) {
    return (
      <main className="min-h-screen px-6 py-12">
        <ErrorState
          title="Unable to verify your session"
          description="Pincrest could not reach the authentication service. Check your connection and try again."
          onRetry={() => {
            void refreshSession().catch((error: unknown) => {
              console.error("Unable to restore the Pincrest session.", error);
            });
          }}
        />
      </main>
    );
  }

  const isRedirecting =
    status === "checking" ||
    (status === "authenticated" &&
      (pathname === "/login" ||
        pathname.startsWith("/login/") ||
        pathname === "/register" ||
        pathname.startsWith("/register/"))) ||
    (status === "unauthenticated" && !isPublicAuthPath(pathname));

  if (isRedirecting) {
    return (
      <main className="min-h-screen px-6 py-12">
        <LoadingState label="Checking your session" />
      </main>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return auth;
}
