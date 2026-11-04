import { apiRequest } from "@/services/api-client";
import { parsePin, type Pin } from "@/services/pins";

type EntityId = string | number;

export interface Board {
  id: EntityId;
  name: string;
  description: string;
  coverImage: string | null;
  ownerId: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface BoardInput {
  name: string;
  description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntityId(value: unknown): value is EntityId {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value))
  );
}

function getData(
  payload: unknown,
  description: string,
): Record<string, unknown> {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error(`The Board service returned an invalid ${description}.`);
  }

  return payload.data;
}

function parseBoard(value: unknown): Board {
  if (
    !isRecord(value) ||
    !isEntityId(value.id) ||
    typeof value.name !== "string" ||
    typeof value.description !== "string" ||
    !isEntityId(value.ownerId) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    (value.coverImage !== undefined &&
      value.coverImage !== null &&
      typeof value.coverImage !== "string")
  ) {
    throw new Error("The Board service returned an invalid Board.");
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    coverImage: typeof value.coverImage === "string" ? value.coverImage : null,
    ownerId: value.ownerId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseBoardFromPayload(payload: unknown): Board {
  const data = getData(payload, "Board response");
  return parseBoard(data.board ?? data);
}

function parseBoardList(payload: unknown): Board[] {
  const data = getData(payload, "Board list");

  if (!Array.isArray(data.boards)) {
    throw new Error("The Board service returned an invalid Board list.");
  }

  return data.boards.map(parseBoard);
}

export async function getMyBoards(signal?: AbortSignal): Promise<Board[]> {
  const payload = await apiRequest<unknown>("/api/v1/boards/mine", { signal });
  return parseBoardList(payload);
}

export async function getPublicBoards(
  username: string,
  signal?: AbortSignal,
): Promise<Board[]> {
  const payload = await apiRequest<unknown>(
    `/api/v1/users/${encodeURIComponent(username)}/boards`,
    { signal },
  );
  return parseBoardList(payload);
}

export async function getBoard(id: EntityId): Promise<Board> {
  const payload = await apiRequest<unknown>(
    `/api/v1/boards/${encodeURIComponent(String(id))}`,
  );
  return parseBoardFromPayload(payload);
}

export async function getBoardPins(id: EntityId): Promise<Pin[]> {
  const payload = await apiRequest<unknown>(
    `/api/v1/boards/${encodeURIComponent(String(id))}/pins`,
  );
  const data = getData(payload, "Board Pins");

  if (!Array.isArray(data.pins)) {
    throw new Error("The Board service returned an invalid Pin list.");
  }

  return data.pins.map(parsePin);
}

export async function createBoard(input: BoardInput): Promise<Board> {
  const payload = await apiRequest<unknown>("/api/v1/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseBoardFromPayload(payload);
}

export async function updateBoard(
  id: EntityId,
  input: BoardInput,
): Promise<Board> {
  const payload = await apiRequest<unknown>(
    `/api/v1/boards/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return parseBoardFromPayload(payload);
}

export function deleteBoard(id: EntityId): Promise<void> {
  return apiRequest<void>(`/api/v1/boards/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

export function savePinToBoard(
  boardId: EntityId,
  pinId: EntityId,
): Promise<void> {
  return apiRequest<void>(
    `/api/v1/boards/${encodeURIComponent(String(boardId))}/pins`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId }),
    },
  );
}

export function removePinFromBoard(
  boardId: EntityId,
  pinId: EntityId,
): Promise<void> {
  return apiRequest<void>(
    `/api/v1/boards/${encodeURIComponent(String(boardId))}/pins/${encodeURIComponent(String(pinId))}`,
    { method: "DELETE" },
  );
}
