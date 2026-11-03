import { apiRequest } from "@/services/api-client";
import {
  parseBoard,
  parseCollection,
  parseEntity,
  parsePin,
  type Board,
  type Pin,
} from "@/services/content";

export interface BoardInput {
  name: string;
  description: string;
}

export async function getMyBoards(signal?: AbortSignal): Promise<Board[]> {
  const payload = await apiRequest<unknown>("api/v1/boards/mine", { signal });
  return parseCollection(payload, "boards", parseBoard);
}

export async function getBoard(
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const payload = await apiRequest<unknown>(
    `api/v1/boards/${encodeURIComponent(boardId)}`,
    { signal },
  );
  return parseEntity(payload, "board", parseBoard);
}

export async function getBoardPins(
  boardId: string,
  signal?: AbortSignal,
): Promise<Pin[]> {
  const payload = await apiRequest<unknown>(
    `api/v1/boards/${encodeURIComponent(boardId)}/pins`,
    { signal },
  );
  return parseCollection(payload, "pins", parsePin);
}

export async function createBoard(input: BoardInput): Promise<Board> {
  const payload = await apiRequest<unknown>("api/v1/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseEntity(payload, "board", parseBoard);
}

export async function updateBoard(
  boardId: string,
  input: BoardInput,
): Promise<Board> {
  const payload = await apiRequest<unknown>(
    `api/v1/boards/${encodeURIComponent(boardId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return parseEntity(payload, "board", parseBoard);
}

export function deleteBoard(boardId: string): Promise<void> {
  return apiRequest<void>(`api/v1/boards/${encodeURIComponent(boardId)}`, {
    method: "DELETE",
  });
}

export function savePinToBoard(boardId: string, pinId: string): Promise<void> {
  return apiRequest<void>(`api/v1/boards/${encodeURIComponent(boardId)}/pins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinId }),
  });
}

export function removePinFromBoard(
  boardId: string,
  pinId: string,
): Promise<void> {
  return apiRequest<void>(
    `api/v1/boards/${encodeURIComponent(boardId)}/pins/${encodeURIComponent(pinId)}`,
    { method: "DELETE" },
  );
}
