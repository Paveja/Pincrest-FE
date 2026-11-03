import { apiRequest } from "@/services/api-client";

export interface RegistrationInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function register(input: RegistrationInput): Promise<unknown> {
  return apiRequest<unknown>("/api/v1/auth/register", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput): Promise<unknown> {
  return apiRequest<unknown>("/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function getCurrentSession(signal?: AbortSignal): Promise<unknown> {
  return apiRequest<unknown>("/api/v1/auth/me", {
    credentials: "include",
    signal,
  });
}

export function endSession(): Promise<unknown> {
  return apiRequest<unknown>("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
