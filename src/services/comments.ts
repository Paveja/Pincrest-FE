import { apiRequest, ApiError } from "@/services/api-client";

type EntityId = string | number;

export interface CommentAuthor {
  id: EntityId;
  name: string;
  username: string;
  profileImage: string | null;
}

export interface PinComment {
  id: EntityId;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

export interface PinCommentPage {
  comments: PinComment[];
  pagination: CommentPagination;
}

const COMMENTS_PER_PAGE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntityId(value: unknown): value is EntityId {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value))
  );
}

function isDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function parseComment(value: unknown): PinComment {
  if (
    !isRecord(value) ||
    !isEntityId(value.id) ||
    typeof value.content !== "string" ||
    !isDateTime(value.createdAt) ||
    !isDateTime(value.updatedAt) ||
    !isRecord(value.author) ||
    !isEntityId(value.author.id) ||
    typeof value.author.name !== "string" ||
    typeof value.author.username !== "string" ||
    (value.author.profileImage !== null &&
      typeof value.author.profileImage !== "string")
  ) {
    throw new ApiError(
      "The comments service returned an invalid comment.",
      null,
    );
  }

  return {
    id: value.id,
    content: value.content,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    author: {
      id: value.author.id,
      name: value.author.name,
      username: value.author.username,
      profileImage: value.author.profileImage,
    },
  };
}

function parseCommentResponse(payload: unknown): PinComment {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new ApiError(
      "The comments service returned an invalid response.",
      null,
    );
  }

  return parseComment(payload.data.comment);
}

export async function getPinComments(
  pinId: EntityId,
  page = 1,
  signal?: AbortSignal,
): Promise<PinCommentPage> {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("The comments page number must be a positive integer.");
  }

  const payload: unknown = await apiRequest(
    `/api/v1/pins/${encodeURIComponent(String(pinId))}/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`,
    { signal },
  );

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !Array.isArray(payload.data.comments) ||
    !isRecord(payload.data.pagination)
  ) {
    throw new ApiError(
      "The comments service returned an invalid comment list.",
      null,
    );
  }

  const pagination = payload.data.pagination;
  if (
    !Number.isSafeInteger(pagination.page) ||
    (pagination.page as number) < 1 ||
    !Number.isSafeInteger(pagination.limit) ||
    (pagination.limit as number) < 1 ||
    !Number.isSafeInteger(pagination.total) ||
    (pagination.total as number) < 0 ||
    typeof pagination.hasNextPage !== "boolean"
  ) {
    throw new ApiError(
      "The comments service returned invalid pagination.",
      null,
    );
  }

  return {
    comments: payload.data.comments.map(parseComment),
    pagination: {
      page: pagination.page as number,
      limit: pagination.limit as number,
      total: pagination.total as number,
      hasNextPage: pagination.hasNextPage,
    },
  };
}

export async function createPinComment(
  pinId: EntityId,
  content: string,
): Promise<PinComment> {
  const payload: unknown = await apiRequest(
    `/api/v1/pins/${encodeURIComponent(String(pinId))}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  return parseCommentResponse(payload);
}

export async function updatePinComment(
  pinId: EntityId,
  commentId: EntityId,
  content: string,
): Promise<PinComment> {
  const payload: unknown = await apiRequest(
    `/api/v1/pins/${encodeURIComponent(String(pinId))}/comments/${encodeURIComponent(String(commentId))}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  return parseCommentResponse(payload);
}

export function deletePinComment(
  pinId: EntityId,
  commentId: EntityId,
): Promise<void> {
  return apiRequest(
    `/api/v1/pins/${encodeURIComponent(String(pinId))}/comments/${encodeURIComponent(String(commentId))}`,
    { method: "DELETE" },
  );
}
