export const SESSION_EXPIRED_EVENT = "pincrest:session-expired";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    options?: ErrorOptions,
    public readonly code: string | null = null,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getBackendError(
  status: number,
  responseText: string,
): { code: string | null; message: string } {
  const fallbackMessage = getHttpErrorMessage(status);

  try {
    const payload: unknown = JSON.parse(responseText);

    if (isRecord(payload) && isRecord(payload.error)) {
      return {
        code:
          typeof payload.error.code === "string" ? payload.error.code : null,
        message:
          typeof payload.error.message === "string"
            ? payload.error.message
            : fallbackMessage,
      };
    }
  } catch {
    // Non-JSON error bodies use the status-specific fallback message.
  }

  return { code: null, message: fallbackMessage };
}

function isAuthenticationRequest(path: string): boolean {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return normalizedPath.startsWith("auth/");
}

function expireBrowserSession(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

function getHttpErrorMessage(status: number): string {
  if (status === 401) {
    return "The backend did not authorize this request.";
  }

  if (status === 403) {
    return "You do not have permission to complete this request.";
  }

  if (status === 404) {
    return "The requested information could not be found.";
  }

  if (status === 429) {
    return "Too many requests. Wait a moment and try again.";
  }

  if (status >= 500) {
    return "The backend service is unavailable. Try again shortly.";
  }

  return "The request could not be completed.";
}

function getApiUrl(path: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new ApiError("The backend API URL has not been configured.", null);
  }

  let baseUrl: URL;

  try {
    baseUrl = new URL(configuredBaseUrl);
  } catch (cause) {
    throw new ApiError("The backend API URL is invalid.", null, { cause });
  }

  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new ApiError("The backend API URL must use HTTP or HTTPS.", null);
  }

  const basePath = baseUrl.href.endsWith("/")
    ? baseUrl.href
    : `${baseUrl.href}/`;
  const relativePath = path.replace(/^\/+/, "");
  const requestUrl = new URL(relativePath, basePath);

  if (requestUrl.origin !== baseUrl.origin) {
    throw new ApiError(
      "The API request path must be relative to its base URL.",
      null,
    );
  }

  return requestUrl.href;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const requestUrl = getApiUrl(path);
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw cause;
    }

    throw new ApiError(
      "Unable to reach the backend service. Check your connection and try again.",
      null,
      { cause },
    );
  }

  if (!response.ok) {
    const responseText = await response.text();
    const backendError = getBackendError(response.status, responseText);

    if (response.status === 401 && !isAuthenticationRequest(path)) {
      expireBrowserSession();
    }

    throw new ApiError(
      backendError.message,
      response.status,
      undefined,
      backendError.code,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new ApiError(
      "The backend service returned an invalid response.",
      response.status,
      { cause },
    );
  }
}
