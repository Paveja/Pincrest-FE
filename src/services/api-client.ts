export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    options?: ErrorOptions,
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
    throw new ApiError(getHttpErrorMessage(response.status), response.status);
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
