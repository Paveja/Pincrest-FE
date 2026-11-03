export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    options?: ErrorOptions,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

function getApiUrl(path: string): URL {
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

  return requestUrl;
}

function getHttpErrorMessage(status: number): string {
  if (status === 401) {
    return "Email or password is incorrect.";
  }

  if (status === 403) {
    return "You do not have permission to complete this request.";
  }

  if (status === 404) {
    return "The requested information could not be found.";
  }

  if (status === 409) {
    return "An account with these details already exists.";
  }

  if (status === 422) {
    return "Check the highlighted fields and try again.";
  }

  if (status === 429) {
    return "Too many requests. Wait a moment and try again.";
  }

  if (status >= 500) {
    return "The backend service is unavailable. Try again shortly.";
  }

  return "The request could not be completed.";
}

function getFieldErrors(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const body = payload as Record<string, unknown>;
  const errors = body.fieldErrors ?? body.errors;

  if (!errors || typeof errors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>).flatMap(
      ([field, value]) => {
        const message = Array.isArray(value) ? value[0] : value;
        return typeof message === "string"
          ? [[field, message] as [string, string]]
          : [];
      },
    ),
  );
}

function getApiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return getHttpErrorMessage(status);
}

async function readErrorPayload(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readSuccessPayload<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch (cause) {
    throw new ApiError(
      "The backend service returned an invalid response.",
      response.status,
      { cause },
    );
  }
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
    const payload = await readErrorPayload(response);
    throw new ApiError(
      getApiErrorMessage(payload, response.status),
      response.status,
      undefined,
      getFieldErrors(payload),
    );
  }

  return readSuccessPayload<T>(response);
}
