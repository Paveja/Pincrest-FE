import { apiRequest } from "@/services/api-client";
import { parsePin, type Pin } from "@/services/pins";

export interface PinCreator {
  id: string | number;
  name: string;
  username: string;
  profileImage: string | null;
}

export interface FeedPin extends Pin {
  creator: PinCreator;
  isLiked: boolean;
  likeCount: number;
}

export interface PinFeedPage {
  pins: FeedPin[];
  page: number;
  hasNextPage: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntityId(value: unknown): value is string | number {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value))
  );
}

function parseCreator(value: unknown): PinCreator {
  if (
    !isRecord(value) ||
    !isEntityId(value.id) ||
    typeof value.name !== "string" ||
    typeof value.username !== "string" ||
    (value.profileImage !== null && typeof value.profileImage !== "string")
  ) {
    throw new Error("The feed service returned invalid creator information.");
  }

  return {
    id: value.id,
    name: value.name,
    username: value.username,
    profileImage: value.profileImage,
  };
}

function parseFeedPin(value: unknown): FeedPin {
  if (
    !isRecord(value) ||
    typeof value.isLiked !== "boolean" ||
    typeof value.likeCount !== "number" ||
    !Number.isSafeInteger(value.likeCount) ||
    value.likeCount < 0
  ) {
    throw new Error("The feed service returned an invalid Pin.");
  }

  return {
    ...parsePin(value),
    creator: parseCreator(value.creator),
    isLiked: value.isLiked,
    likeCount: value.likeCount,
  };
}

export async function getPinFeedPage(
  page: number,
  signal?: AbortSignal,
): Promise<PinFeedPage> {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("The feed page number must be a positive integer.");
  }

  const payload = await apiRequest<unknown>(
    `/api/v1/feed?page=${encodeURIComponent(String(page))}`,
    { signal },
  );

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !Array.isArray(payload.data.pins) ||
    !isRecord(payload.data.pagination) ||
    typeof payload.data.pagination.page !== "number" ||
    !Number.isSafeInteger(payload.data.pagination.page) ||
    payload.data.pagination.page < 1 ||
    typeof payload.data.pagination.hasNextPage !== "boolean"
  ) {
    throw new Error("The feed service returned an invalid page.");
  }

  return {
    pins: payload.data.pins.map(parseFeedPin),
    page: payload.data.pagination.page as number,
    hasNextPage: payload.data.pagination.hasNextPage,
  };
}
