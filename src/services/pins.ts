import { apiRequest, apiUpload } from "@/services/api-client";

type EntityId = string | number;

export interface Pin {
  id: EntityId;
  title: string;
  description: string;
  imageUrl: string;
  destinationUrl?: string | null;
  ownerId: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface PinInput {
  title: string;
  description: string;
  imageUrl: string;
  destinationUrl?: string | null;
}

function isEntityId(value: unknown): value is EntityId {
  return (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value))
  );
}

export function getSafeDestinationUrl(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePin(value: unknown): Pin {
  if (
    !isRecord(value) ||
    !isEntityId(value.id) ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.imageUrl !== "string" ||
    !isEntityId(value.ownerId) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    (value.destinationUrl !== undefined &&
      value.destinationUrl !== null &&
      typeof value.destinationUrl !== "string")
  ) {
    throw new Error("The Pin service returned an invalid Pin.");
  }

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    imageUrl: value.imageUrl,
    destinationUrl: value.destinationUrl as string | null | undefined,
    ownerId: value.ownerId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseSinglePin(payload: unknown): Pin {
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !isRecord(payload.data.pin)
  ) {
    throw new Error("The Pin service returned an invalid response.");
  }

  return parsePin(payload.data.pin);
}

export async function getMyPins(signal?: AbortSignal): Promise<Pin[]> {
  const payload = await apiRequest<unknown>("/api/v1/pins/mine", { signal });

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !Array.isArray(payload.data.pins)
  ) {
    throw new Error("The Pin service returned an invalid Pin list.");
  }

  return payload.data.pins.map(parsePin);
}

export async function createPin(input: PinInput): Promise<Pin> {
  const payload = await apiRequest<unknown>("/api/v1/pins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseSinglePin(payload);
}

export async function updatePin(id: EntityId, input: PinInput): Promise<Pin> {
  const payload = await apiRequest<unknown>(
    `/api/v1/pins/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  return parseSinglePin(payload);
}

export function deletePin(id: EntityId): Promise<void> {
  return apiRequest<void>(`/api/v1/pins/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

export function likePin(id: EntityId): Promise<void> {
  return apiRequest<void>(
    `/api/v1/pins/${encodeURIComponent(String(id))}/like`,
    { method: "PUT" },
  );
}

export function unlikePin(id: EntityId): Promise<void> {
  return apiRequest<void>(
    `/api/v1/pins/${encodeURIComponent(String(id))}/like`,
    { method: "DELETE" },
  );
}

export async function uploadPinImage(
  image: File,
  onProgress: (percentage: number) => void,
): Promise<string> {
  const body = new FormData();
  body.append("image", image);

  const payload = await apiUpload<unknown>(
    "/api/v1/uploads/images",
    body,
    onProgress,
  );

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    typeof payload.data.url !== "string" ||
    !payload.data.url.trim()
  ) {
    throw new Error("The image service returned an invalid response.");
  }

  return payload.data.url;
}
