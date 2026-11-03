import { ApiError } from "@/services/api-client";

export interface Pin {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  destinationUrl: string | null;
  ownerId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidPayload(): ApiError {
  return new ApiError(
    "The backend returned information in an unexpected format. Try again later.",
    null,
  );
}

function readString(
  record: Record<string, unknown>,
  field: string,
  optional = false,
): string | null {
  const value = record[field];

  if (optional && (value === undefined || value === null)) {
    return null;
  }

  if (typeof value !== "string") {
    throw invalidPayload();
  }

  return value;
}

export function parsePin(value: unknown): Pin {
  if (!isRecord(value)) {
    throw invalidPayload();
  }

  return {
    id: readString(value, "id")!,
    title: readString(value, "title")!,
    description: readString(value, "description", true),
    imageUrl: readString(value, "imageUrl")!,
    destinationUrl: readString(value, "destinationUrl", true),
    ownerId: readString(value, "ownerId")!,
    createdAt: readString(value, "createdAt", true),
    updatedAt: readString(value, "updatedAt", true),
  };
}

export function parseBoard(value: unknown): Board {
  if (!isRecord(value)) {
    throw invalidPayload();
  }

  return {
    id: readString(value, "id")!,
    name: readString(value, "name")!,
    description: readString(value, "description", true),
  };
}

export function parseCollection<T>(
  payload: unknown,
  collectionKey: string,
  parseItem: (value: unknown) => T,
): T[] {
  if (Array.isArray(payload)) {
    return payload.map(parseItem);
  }

  if (!isRecord(payload)) {
    throw invalidPayload();
  }

  if (collectionKey in payload) {
    return parseCollection(payload[collectionKey], collectionKey, parseItem);
  }

  if ("data" in payload) {
    return parseCollection(payload.data, collectionKey, parseItem);
  }

  throw invalidPayload();
}

export function parseEntity<T>(
  payload: unknown,
  entityKey: string,
  parseItem: (value: unknown) => T,
): T {
  if (!isRecord(payload)) {
    throw invalidPayload();
  }

  if (entityKey in payload) {
    return parseEntity(payload[entityKey], entityKey, parseItem);
  }

  if ("data" in payload) {
    return parseEntity(payload.data, entityKey, parseItem);
  }

  return parseItem(payload);
}
