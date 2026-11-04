import { apiRequest, ApiError } from "@/services/api-client";
import { parsePin, type Pin } from "@/services/pins";

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  bio: string | null;
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchPage<T> {
  items: T[];
  pagination: SearchPagination;
}

const PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parsePagination(value: unknown): SearchPagination {
  if (
    !isRecord(value) ||
    typeof value.page !== "number" ||
    !Number.isSafeInteger(value.page) ||
    value.page < 1 ||
    typeof value.limit !== "number" ||
    !Number.isSafeInteger(value.limit) ||
    value.limit < 1 ||
    !isNonNegativeInteger(value.total) ||
    !isNonNegativeInteger(value.totalPages)
  ) {
    throw new ApiError(
      "The search service returned invalid pagination data.",
      null,
    );
  }

  return {
    page: value.page as number,
    limit: value.limit as number,
    total: value.total,
    totalPages: value.totalPages,
  };
}

function parseSearchResponse<T>(
  payload: unknown,
  collectionKey: "pins" | "users",
  parseItem: (value: unknown) => T,
): SearchPage<T> {
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !Array.isArray(payload.data[collectionKey])
  ) {
    throw new ApiError(
      "The search service returned an invalid response.",
      null,
    );
  }

  return {
    items: payload.data[collectionKey].map(parseItem),
    pagination: parsePagination(payload.data.pagination),
  };
}

function parseSearchUser(value: unknown): SearchUser {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.username !== "string" ||
    (typeof value.profileImage !== "string" && value.profileImage !== null) ||
    (typeof value.bio !== "string" && value.bio !== null)
  ) {
    throw new ApiError("The search service returned an invalid user.", null);
  }

  return {
    id: value.id,
    name: value.name,
    username: value.username,
    profileImage: value.profileImage,
    bio: value.bio,
  };
}

function getSearchUrl(path: "pins" | "users", query: string, page: number) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  return `/api/v1/search/${path}?${params.toString()}`;
}

export async function searchPins(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<SearchPage<Pin>> {
  const payload = await apiRequest<unknown>(getSearchUrl("pins", query, page), {
    signal,
  });

  return parseSearchResponse(payload, "pins", parsePin);
}

export async function searchUsers(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<SearchPage<SearchUser>> {
  const payload = await apiRequest<unknown>(
    getSearchUrl("users", query, page),
    {
      signal,
    },
  );

  return parseSearchResponse(payload, "users", parseSearchUser);
}
