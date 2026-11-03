import { ApiError, apiRequest } from "@/services/api-client";

export type AuthUser = Record<string, unknown>;

interface ApiEnvelope<T> {
  data: T;
}

interface RegistrationInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractUser(payload: unknown): AuthUser {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new ApiError("The backend returned an invalid user response.", null);
  }

  const data = payload.data;

  if ("user" in data) {
    if (!isRecord(data.user) || Object.keys(data.user).length === 0) {
      throw new ApiError(
        "The backend returned an invalid user response.",
        null,
      );
    }

    return data.user;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError("The backend returned an invalid user response.", null);
  }

  return data;
}

async function sendAuthRequest(path: string, body?: object): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>(path, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function requestCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<ApiEnvelope<unknown>>("auth/me", {
    credentials: "include",
    cache: "no-store",
  });

  return extractUser(response);
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<void> {
  await sendAuthRequest("auth/login", { email, password });
}

export async function registerAccount(input: RegistrationInput): Promise<void> {
  await sendAuthRequest("auth/register", input);
}

export async function invalidateSession(): Promise<void> {
  await sendAuthRequest("auth/logout");
}
