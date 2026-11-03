export type RegistrationValues = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type LoginValues = {
  email: string;
  password: string;
};

export type AuthField = keyof RegistrationValues;
export type FieldErrors = Partial<Record<AuthField, string>>;

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

const AUTH_API_PATHS = {
  register: "/auth/register",
  login: "/auth/login",
  logout: "/auth/logout",
  session: "/auth/me",
} as const;

export class AuthApiError extends Error {
  fieldErrors: FieldErrors;
  status?: number;

  constructor(message: string, fieldErrors: FieldErrors = {}, status?: number) {
    super(message);
    this.name = "AuthApiError";
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFieldErrors(payload: unknown): FieldErrors {
  if (!isRecord(payload)) {
    return {};
  }

  const rawErrors = payload.errors ?? payload.fieldErrors;
  if (!isRecord(rawErrors)) {
    return {};
  }

  const fields: AuthField[] = ["name", "username", "email", "password"];
  const fieldErrors: FieldErrors = {};

  for (const field of fields) {
    const value = rawErrors[field];
    if (typeof value === "string") {
      fieldErrors[field] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      fieldErrors[field] = value[0];
    }
  }

  return fieldErrors;
}

function getFallbackMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "The email or password is incorrect.";
  }

  if (status === 409) {
    return "That email or username is already registered. Try signing in instead.";
  }

  if (status >= 500) {
    return "Pincrest couldn't complete that request. Please try again.";
  }

  return "The request couldn't be completed. Check your details and try again.";
}

async function throwResponseError(response: Response): Promise<never> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message =
    isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : getFallbackMessage(response.status);

  throw new AuthApiError(message, getFieldErrors(payload), response.status);
}

async function requestAuth(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new AuthApiError(
      "Pincrest couldn't reach the server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    await throwResponseError(response);
  }

  return response;
}

export function validateRegistration(values: RegistrationValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter your name.";
  }

  if (!values.username.trim()) {
    errors.username = "Choose a username.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password.length < 8) {
    errors.password = "Use at least 8 characters for your password.";
  }

  return errors;
}

export function validateLogin(values: LoginValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export async function registerAccount(
  values: RegistrationValues,
): Promise<void> {
  await requestAuth(AUTH_API_PATHS.register, {
    method: "POST",
    body: JSON.stringify({
      name: values.name.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
    }),
  });
}

export async function loginAccount(values: LoginValues): Promise<void> {
  await requestAuth(AUTH_API_PATHS.login, {
    method: "POST",
    body: JSON.stringify({
      email: values.email.trim(),
      password: values.password,
    }),
  });
}

export async function logoutAccount(): Promise<void> {
  await requestAuth(AUTH_API_PATHS.logout, { method: "POST" });
}

export async function checkCurrentSession(
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    await requestAuth(AUTH_API_PATHS.session, { method: "GET", signal });
    return true;
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      return false;
    }

    throw error;
  }
}
